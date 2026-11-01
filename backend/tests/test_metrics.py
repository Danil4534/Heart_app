"""Mean-rank selection tests."""

from app.metrics import pick_baseline, pick_best


def _row(algo: str, method: str, recall: float, f1: float, pr_auc: float) -> dict:
    return {
        "algo": algo,
        "method": method,
        "cv": {
            "precision": 0.2,
            "recall": recall,
            "f1": f1,
            "roc_auc": 0.7,
            "pr_auc": pr_auc,
            "mcc": 0.1,
            "accuracy": 0.9,
        },
    }


def test_pick_best_and_baseline_by_mean_rank() -> None:
    results = [
        _row("GB", "Без балансування", 0.06, 0.10, 0.12),
        _row("LR", "Без балансування", 0.04, 0.08, 0.10),
        _row("LR", "Зважування класів", 0.80, 0.23, 0.20),
        _row("RF", "SMOTE", 0.40, 0.18, 0.16),
    ]
    assert pick_best(results) == {"algo": "LR", "method": "Зважування класів"}
    assert pick_baseline(results) == {"algo": "GB", "method": "Без балансування"}
