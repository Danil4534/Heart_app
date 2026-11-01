"""Shared fixtures: fake artifacts + FastAPI TestClient."""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient
from sklearn.model_selection import train_test_split

from app.config import ALGORITHMS, METHODS, SEED
from app.data import load_dataset
from app.models import build_pipeline, fit_pipeline
from app.training.run import model_filename


def _metrics(recall: float, f1: float, pr_auc: float, roc_auc: float = 0.7) -> dict:
    return {
        "precision": max(f1 / 2, 0.01),
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "mcc": 0.05,
        "accuracy": 0.9,
    }


def _config_row(
    algo: str,
    method: str,
    *,
    recall: float,
    model_file: str | None,
) -> dict:
    cv = _metrics(recall, min(recall, 0.4), 0.15 + recall / 10)
    test = _metrics(max(recall - 0.02, 0.0), min(recall, 0.35), 0.12 + recall / 10)
    return {
        "algo": algo,
        "method": method,
        "cv": cv,
        "cv_std": _metrics(0.01, 0.01, 0.01, 0.01),
        "test": test,
        "cm": [[90, 10], [5, 5]],
        "roc": {"fpr": [0.0, 0.2, 1.0], "tpr": [0.0, 0.6, 1.0]},
        "pr": {"precision": [1.0, 0.4, 0.2], "recall": [0.0, 0.5, 1.0]},
        "fit_seconds": 0.5,
        "model_file": model_file,
    }


def _stats(tag: str) -> dict:
    n = 5109 if tag == "ds1" else 4981
    n_pos = 249 if tag == "ds1" else 248
    ntr = int(n * 0.8)
    nte = n - ntr
    ntr_pos = int(n_pos * 0.8)
    nte_pos = n_pos - ntr_pos
    return {
        "tag": tag,
        "n": n,
        "n_pos": n_pos,
        "ntr": ntr,
        "ntr_pos": ntr_pos,
        "nte": nte,
        "nte_pos": nte_pos,
        "bmi_missing": 201 if tag == "ds1" else 0,
        "class_before_smote": {"0": ntr - ntr_pos, "1": ntr_pos},
        "class_after_smote": {"0": ntr - ntr_pos, "1": ntr - ntr_pos},
    }


def write_fake_artifacts(directory: Path) -> None:
    """Write two results JSON files and LR/SVM joblib pipelines."""
    x, y = load_dataset("ds1")
    x_s, _, y_s, _ = train_test_split(
        x, y, train_size=240, stratify=y, random_state=SEED
    )
    saved: dict[tuple[str, str], str] = {}
    for algo, method in (("LR", "Без балансування"), ("SVM", "Без балансування")):
        pipeline = build_pipeline(algo, method, y_s)
        fit_pipeline(pipeline, x_s, y_s, algo, method)
        for tag in ("ds1", "ds2"):
            filename = model_filename(tag, algo, method)
            joblib.dump(pipeline, directory / filename)
            saved[(tag, algo, method)] = filename

    for tag in ("ds1", "ds2"):
        configs = []
        for i, algo in enumerate(ALGORITHMS):
            for j, method in enumerate(METHODS):
                recall = 0.05 + 0.12 * i + 0.03 * j
                if algo == "LR" and method == "Зважування класів":
                    recall = 0.80
                if algo == "GB" and method == "Без балансування":
                    recall = 0.06
                model_file = saved.get((tag, algo, method))
                configs.append(
                    _config_row(algo, method, recall=recall, model_file=model_file)
                )
        payload = {
            "dataset": _stats(tag),
            "configs": configs,
            "best": {"algo": "LR", "method": "Без балансування"},
            "baseline": {"algo": "SVM", "method": "Без балансування"},
            "importance": {
                "best": {"age": 0.12, "bmi": 0.04, "avg_glucose_level": 0.03},
                "baseline": {"age": 0.08, "bmi": 0.01},
            },
        }
        (directory / f"{tag}_results.json").write_text(
            json.dumps(payload, ensure_ascii=False),
            encoding="utf-8",
        )


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    write_fake_artifacts(tmp_path)
    monkeypatch.setattr("app.config.ARTIFACTS_DIR", tmp_path)
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
