"""Leakage, confusion-matrix, and artifact-schema tests."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

from app.config import ARTIFACTS_DIR, SEED, TEST_SIZE
from app.data import load_dataset
from app.models import build_pipeline, fit_pipeline, score
from app.schemas import ResultsFile
from app.training.run import evaluate_test


def test_sampler_is_not_applied_on_predict() -> None:
    x, y = load_dataset("ds1")
    x_train, x_test, y_train, _y_test = train_test_split(
        x, y, test_size=TEST_SIZE, stratify=y, random_state=SEED
    )
    pipeline = build_pipeline("LR", "SMOTE", y_train)
    fit_pipeline(pipeline, x_train, y_train, "LR", "SMOTE")
    assert "sampler" in pipeline.named_steps

    def _boom(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("sampler.fit_resample must not run during predict")

    with patch.object(pipeline.named_steps["sampler"], "fit_resample", side_effect=_boom):
        pred = pipeline.predict(x_test)
        _ = score(pipeline, x_test)

    assert len(pred) == len(x_test)


def test_confusion_matrix_sums_to_test_size() -> None:
    x, y = load_dataset("ds1")
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=TEST_SIZE, stratify=y, random_state=SEED
    )
    pipeline = build_pipeline("LR", "Без балансування", y_train)
    fit_pipeline(pipeline, x_train, y_train, "LR", "Без балансування")
    pred = pipeline.predict(x_test)
    cm = confusion_matrix(y_test, pred, labels=[0, 1])
    assert int(cm.sum()) == len(y_test)

    block = evaluate_test(pipeline, x_test, y_test)
    nested_sum = int(np.asarray(block["cm"]).sum())
    assert nested_sum == len(y_test)


def _minimal_results_payload() -> dict:
    metrics = {
        "precision": 0.1,
        "recall": 0.2,
        "f1": 0.15,
        "roc_auc": 0.7,
        "pr_auc": 0.3,
        "mcc": 0.05,
        "accuracy": 0.9,
    }
    return {
        "dataset": {
            "tag": "ds1",
            "n": 10,
            "n_pos": 2,
            "ntr": 8,
            "ntr_pos": 1,
            "nte": 2,
            "nte_pos": 1,
            "bmi_missing": 0,
            "class_before_smote": {"0": 7, "1": 1},
            "class_after_smote": {"0": 7, "1": 7},
        },
        "configs": [
            {
                "algo": "LR",
                "method": "Без балансування",
                "cv": metrics,
                "cv_std": metrics,
                "test": metrics,
                "cm": [[1, 0], [0, 1]],
                "roc": {"fpr": [0.0, 1.0], "tpr": [0.0, 1.0]},
                "pr": {"precision": [1.0, 0.5], "recall": [0.0, 1.0]},
                "fit_seconds": 0.01,
                "model_file": None,
            }
        ],
        "best": {"algo": "LR", "method": "Без балансування"},
        "baseline": {"algo": "LR", "method": "Без балансування"},
        "importance": {
            "best": {"age": 0.1},
            "baseline": {"age": 0.05},
        },
    }


def test_results_schema_accepts_valid_payload() -> None:
    ResultsFile.model_validate(_minimal_results_payload())


def test_artifact_results_json_matches_schema_when_present() -> None:
    paths = list(Path(ARTIFACTS_DIR).glob("*_results.json"))
    if not paths:
        payload = _minimal_results_payload()
        ResultsFile.model_validate(payload)
        return
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        parsed = ResultsFile.model_validate(data)
        nte = parsed.dataset.nte
        for config in parsed.configs:
            assert sum(sum(row) for row in config.cm) == nte
