"""Classification metrics and mean-rank selection of best / baseline configs."""

from __future__ import annotations

from typing import Any, Mapping, Sequence

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    f1_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)

from app.config import NONE_METHOD, RANK_METRICS


def compute_metrics(
    y: np.ndarray | pd.Series,
    pred: np.ndarray | pd.Series,
    score: np.ndarray | pd.Series,
) -> dict[str, float]:
    """Metrics for the high-risk class (stroke=1)."""
    y_true = np.asarray(y)
    y_pred = np.asarray(pred)
    y_score = np.asarray(score)
    return {
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_score)),
        "pr_auc": float(average_precision_score(y_true, y_score)),
        "mcc": float(matthews_corrcoef(y_true, y_pred)),
        "accuracy": float(accuracy_score(y_true, y_pred)),
    }


def _mean_ranks(
    results: Sequence[Mapping[str, Any]],
    metrics_key: str = "cv",
) -> pd.Series:
    if not results:
        raise ValueError("Cannot rank an empty results list.")
    frame = pd.DataFrame(
        {
            metric: [float(row[metrics_key][metric]) for row in results]
            for metric in RANK_METRICS
        }
    )
    ranks = [frame[metric].rank(ascending=False, method="average") for metric in RANK_METRICS]
    return sum(ranks) / len(RANK_METRICS)


def _winner(results: Sequence[Mapping[str, Any]], metrics_key: str = "cv") -> dict[str, str]:
    mean_rank = _mean_ranks(results, metrics_key=metrics_key)
    # Lowest mean rank; ties broken by original order (stable idxmin).
    idx = int(mean_rank.idxmin())
    row = results[idx]
    return {"algo": str(row["algo"]), "method": str(row["method"])}


def pick_best(
    results: Sequence[Mapping[str, Any]],
    metrics_key: str = "cv",
) -> dict[str, str]:
    """Select the config with the lowest mean rank of recall, f1, pr_auc."""
    return _winner(results, metrics_key=metrics_key)


def pick_baseline(
    results: Sequence[Mapping[str, Any]],
    metrics_key: str = "cv",
) -> dict[str, str]:
    """Same criterion, restricted to method ``Без балансування``."""
    subset = [row for row in results if row.get("method") == NONE_METHOD]
    if not subset:
        raise ValueError(f"No configurations with method {NONE_METHOD!r}.")
    return _winner(subset, metrics_key=metrics_key)
