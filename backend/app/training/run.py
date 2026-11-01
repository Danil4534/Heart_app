"""Train all algorithm × balancing combinations and write artifacts.

CLI::

    python -m app.training.run --datasets ds1 ds2 [--save-all-models]
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.inspection import permutation_importance
from sklearn.metrics import confusion_matrix, precision_recall_curve, roc_curve
from sklearn.model_selection import StratifiedKFold, train_test_split

from app.config import (
    ALGORITHMS,
    ARTIFACTS_DIR,
    CV_FOLDS,
    MAX_CURVE_POINTS,
    METHOD_SLUGS,
    METHODS,
    METRIC_NAMES,
    PERM_REPEATS,
    SEED,
    TEST_SIZE,
)
from app.data import load_dataset
from app.metrics import compute_metrics, pick_baseline, pick_best
from app.models import build_pipeline, fit_pipeline, score
from app.preprocessing import preprocessing_steps
from app.schemas import ResultsFile


def _jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    if isinstance(value, np.ndarray):
        return _jsonable(value.tolist())
    if isinstance(value, (np.floating, np.integer)):
        return value.item()
    if isinstance(value, np.bool_):
        return bool(value)
    return value


def thin_curve(xs: np.ndarray, ys: np.ndarray, max_points: int = MAX_CURVE_POINTS) -> tuple[list[float], list[float]]:
    """Downsample a curve to at most ``max_points`` while keeping endpoints."""
    n = int(len(xs))
    if n <= max_points:
        return [float(v) for v in xs], [float(v) for v in ys]
    idx = np.linspace(0, n - 1, max_points).round().astype(int)
    idx = np.unique(idx)
    return [float(v) for v in xs[idx]], [float(v) for v in ys[idx]]


def class_counts(y: pd.Series | np.ndarray) -> dict[str, int]:
    values, counts = np.unique(np.asarray(y), return_counts=True)
    out = {"0": 0, "1": 0}
    for value, count in zip(values, counts, strict=True):
        out[str(int(value))] = int(count)
    return out


def smote_train_counts(x_train: pd.DataFrame, y_train: pd.Series) -> dict[str, int]:
    """Class counts on train after preprocess + SMOTE (no classifier)."""
    sampler_pipe = ImbPipeline(
        [*preprocessing_steps(), ("sampler", SMOTE(random_state=SEED))]
    )
    _x_res, y_res = sampler_pipe.fit_resample(x_train, y_train)
    return class_counts(y_res)


def dataset_stats(
    tag: str,
    x: pd.DataFrame,
    y: pd.Series,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict[str, Any]:
    bmi_missing = int(x["bmi"].isna().sum()) if "bmi" in x.columns else 0
    return {
        "tag": tag,
        "n": int(len(y)),
        "n_pos": int((y == 1).sum()),
        "ntr": int(len(y_train)),
        "ntr_pos": int((y_train == 1).sum()),
        "nte": int(len(y_test)),
        "nte_pos": int((y_test == 1).sum()),
        "bmi_missing": bmi_missing,
        "class_before_smote": class_counts(y_train),
        "class_after_smote": smote_train_counts(x_train, y_train),
    }


def cross_validate_config(
    algo: str,
    method: str,
    x_train: pd.DataFrame,
    y_train: pd.Series,
) -> tuple[dict[str, float], dict[str, float]]:
    """Mean and std of metrics over StratifiedKFold on train."""
    splitter = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=SEED)
    fold_rows: list[dict[str, float]] = []
    for tr_idx, va_idx in splitter.split(x_train, y_train):
        x_tr = x_train.iloc[tr_idx]
        x_va = x_train.iloc[va_idx]
        y_tr = y_train.iloc[tr_idx]
        y_va = y_train.iloc[va_idx]
        pipeline = build_pipeline(algo, method, y_tr)
        fit_pipeline(pipeline, x_tr, y_tr, algo, method)
        pred = pipeline.predict(x_va)
        scores = score(pipeline, x_va)
        fold_rows.append(compute_metrics(y_va, pred, scores))
    frame = pd.DataFrame(fold_rows)
    mean = {name: float(frame[name].mean()) for name in METRIC_NAMES}
    std = {name: float(frame[name].std(ddof=0)) for name in METRIC_NAMES}
    return mean, std


def evaluate_test(
    pipeline: ImbPipeline,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict[str, Any]:
    pred = pipeline.predict(x_test)
    scores = score(pipeline, x_test)
    metrics = compute_metrics(y_test, pred, scores)
    cm = confusion_matrix(y_test, pred, labels=[0, 1]).tolist()
    fpr, tpr, _ = roc_curve(y_test, scores)
    precision, recall, _ = precision_recall_curve(y_test, scores)
    fpr_t, tpr_t = thin_curve(fpr, tpr)
    prec_t, rec_t = thin_curve(precision, recall)
    return {
        "test": metrics,
        "cm": cm,
        "roc": {"fpr": fpr_t, "tpr": tpr_t},
        "pr": {"precision": prec_t, "recall": rec_t},
    }


def model_filename(tag: str, algo: str, method: str) -> str:
    slug = METHOD_SLUGS[method]
    return f"{tag}_{algo}_{slug}.joblib"


def compute_importance(
    pipeline: ImbPipeline,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict[str, float]:
    result = permutation_importance(
        pipeline,
        x_test,
        y_test,
        scoring="average_precision",
        n_repeats=PERM_REPEATS,
        random_state=SEED,
        n_jobs=-1,
    )
    return {
        str(col): float(value)
        for col, value in zip(x_test.columns, result.importances_mean, strict=True)
    }


def run_dataset(tag: str, save_all_models: bool = False) -> dict[str, Any]:
    """Train all 25 configs for one dataset and return the results payload."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    x, y = load_dataset(tag)
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=SEED,
    )
    x_train = x_train.reset_index(drop=True)
    x_test = x_test.reset_index(drop=True)
    y_train = y_train.reset_index(drop=True)
    y_test = y_test.reset_index(drop=True)

    stats = dataset_stats(tag, x, y, x_train, y_train, x_test, y_test)
    print(
        f"[{tag}] n={stats['n']} n_pos={stats['n_pos']} "
        f"ntr={stats['ntr']} (pos={stats['ntr_pos']}) "
        f"nte={stats['nte']} (pos={stats['nte_pos']}) "
        f"bmi_missing={stats['bmi_missing']}",
        flush=True,
    )
    print(
        f"[{tag}] class train before SMOTE={stats['class_before_smote']} "
        f"after SMOTE={stats['class_after_smote']}",
        flush=True,
    )

    configs: list[dict[str, Any]] = []
    fitted: dict[tuple[str, str], ImbPipeline] = {}
    total = len(ALGORITHMS) * len(METHODS)
    step = 0

    for algo in ALGORITHMS:
        for method in METHODS:
            step += 1
            print(f"[{tag}] {step}/{total} {algo} × {method}: CV...", flush=True)
            cv_mean, cv_std = cross_validate_config(algo, method, x_train, y_train)

            pipeline = build_pipeline(algo, method, y_train)
            t0 = time.perf_counter()
            fit_pipeline(pipeline, x_train, y_train, algo, method)
            fit_seconds = time.perf_counter() - t0
            fitted[(algo, method)] = pipeline

            test_block = evaluate_test(pipeline, x_test, y_test)
            row = {
                "algo": algo,
                "method": method,
                "cv": cv_mean,
                "cv_std": cv_std,
                "test": test_block["test"],
                "cm": test_block["cm"],
                "roc": test_block["roc"],
                "pr": test_block["pr"],
                "fit_seconds": float(fit_seconds),
                "model_file": None,
            }
            configs.append(row)
            print(
                f"[{tag}] {step}/{total} {algo} × {method}: "
                f"CV recall={cv_mean['recall']:.3f} f1={cv_mean['f1']:.3f} "
                f"TEST recall={row['test']['recall']:.3f} "
                f"({fit_seconds:.1f}s)",
                flush=True,
            )

    best = pick_best(configs)
    baseline = pick_baseline(configs)
    print(f"[{tag}] best={best['algo']} × {best['method']}", flush=True)
    print(f"[{tag}] baseline={baseline['algo']} × {baseline['method']}", flush=True)

    print(f"[{tag}] permutation importance (best)...", flush=True)
    importance_best = compute_importance(
        fitted[(best["algo"], best["method"])], x_test, y_test
    )
    print(f"[{tag}] permutation importance (baseline)...", flush=True)
    importance_base = compute_importance(
        fitted[(baseline["algo"], baseline["method"])], x_test, y_test
    )

    save_keys: set[tuple[str, str]]
    if save_all_models:
        save_keys = set(fitted)
    else:
        save_keys = {
            (best["algo"], best["method"]),
            (baseline["algo"], baseline["method"]),
        }

    for row in configs:
        key = (row["algo"], row["method"])
        if key not in save_keys:
            continue
        filename = model_filename(tag, row["algo"], row["method"])
        path = ARTIFACTS_DIR / filename
        joblib.dump(fitted[key], path)
        row["model_file"] = filename
        print(f"[{tag}] saved {filename}", flush=True)

    payload = {
        "dataset": stats,
        "configs": configs,
        "best": best,
        "baseline": baseline,
        "importance": {"best": importance_best, "baseline": importance_base},
    }
    payload = _jsonable(payload)
    ResultsFile.model_validate(payload)

    out_path = ARTIFACTS_DIR / f"{tag}_results.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{tag}] wrote {out_path}", flush=True)
    return payload


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train VasculoRisk experiment grid.")
    parser.add_argument(
        "--datasets",
        nargs="+",
        default=["ds1", "ds2"],
        choices=["ds1", "ds2"],
        help="Dataset tags to train.",
    )
    parser.add_argument(
        "--save-all-models",
        action="store_true",
        help="Save all 25 fitted pipelines per dataset (default: best + baseline).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    for tag in args.datasets:
        run_dataset(tag, save_all_models=args.save_all_models)
    return 0


if __name__ == "__main__":
    sys.exit(main())
