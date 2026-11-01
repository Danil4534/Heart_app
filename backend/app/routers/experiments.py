"""Experiment comparison endpoints backed by cached JSON artifacts."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.artifacts import cache, parse_config_id
from app.config import ALGORITHMS, DELTA_METRICS, METHODS, METRIC_NAMES
from app.schemas import (
    ConfigMetrics,
    CurveBundle,
    DeltaMetrics,
    ExperimentSummary,
    ImportanceResponse,
    ImportanceWhich,
    MetricMatrix,
    MetricSet,
    SourceKind,
)

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


def _metric_value(metrics: MetricSet, name: str) -> float:
    return float(getattr(metrics, name))


def _deltas(best: MetricSet, baseline: MetricSet) -> DeltaMetrics:
    payload = {
        name: _metric_value(best, name) - _metric_value(baseline, name)
        for name in DELTA_METRICS
    }
    return DeltaMetrics.model_validate(payload)


def _summary_for(tag: str) -> ExperimentSummary:
    results = cache.get_results(tag)
    best_cfg = cache.get_config(tag, results.best.algo, results.best.method)
    base_cfg = cache.get_config(tag, results.baseline.algo, results.baseline.method)
    return ExperimentSummary(
        dataset=tag,
        best=results.best,
        baseline=results.baseline,
        best_metrics={"cv": best_cfg.cv, "test": best_cfg.test},
        baseline_metrics={"cv": base_cfg.cv, "test": base_cfg.test},
        deltas={
            "cv": _deltas(best_cfg.cv, base_cfg.cv),
            "test": _deltas(best_cfg.test, base_cfg.test),
        },
    )


@router.get(
    "/compare",
    response_model=list[ExperimentSummary],
    summary="Зведення приростів по всіх наборах даних",
)
def compare_datasets() -> list[ExperimentSummary]:
    """Best vs baseline (Recall, F1, PR-AUC, ROC-AUC) для кожного датасету."""
    return [_summary_for(tag) for tag in cache.dataset_tags()]


@router.get(
    "/{ds}/configs",
    response_model=list[ConfigMetrics],
    summary="Усі 25 конфігурацій з CV- та TEST-метриками",
)
def list_configs(ds: str) -> list[ConfigMetrics]:
    results = cache.get_results(ds)
    return [
        ConfigMetrics(
            algo=row.algo,
            method=row.method,
            cv=row.cv,
            cv_std=row.cv_std,
            test=row.test,
            cm=row.cm,
            fit_seconds=row.fit_seconds,
            model_file=row.model_file,
        )
        for row in results.configs
    ]


@router.get(
    "/{ds}/matrix",
    response_model=MetricMatrix,
    summary="Матриця алгоритм × метод балансування",
)
def metric_matrix(
    ds: str,
    metric: str = Query("recall", description="Назва метрики (наприклад recall, f1, pr_auc)."),
    source: SourceKind = Query("cv", description="Джерело метрик: cv або test."),
) -> MetricMatrix:
    if metric not in METRIC_NAMES:
        raise HTTPException(
            status_code=422,
            detail=f"Невідома метрика {metric!r}. Допустимі: {', '.join(METRIC_NAMES)}.",
        )
    results = cache.get_results(ds)
    lookup = {(row.algo, row.method): row for row in results.configs}
    values: list[list[float | None]] = []
    for algo in ALGORITHMS:
        row_vals: list[float | None] = []
        for method in METHODS:
            config = lookup.get((algo, method))
            if config is None:
                row_vals.append(None)
            else:
                metrics = config.cv if source == "cv" else config.test
                row_vals.append(_metric_value(metrics, metric))
        values.append(row_vals)
    return MetricMatrix(
        methods=list(METHODS),
        algos=list(ALGORITHMS),
        values=values,
        metric=metric,
        source=source,
    )


@router.get(
    "/{ds}/summary",
    response_model=ExperimentSummary,
    summary="Найкраща модель, базова лінія та дельти метрик",
)
def dataset_summary(ds: str) -> ExperimentSummary:
    return _summary_for(ds)


@router.get(
    "/{ds}/curves",
    response_model=list[CurveBundle],
    summary="ROC- та PR-криві вибраних конфігурацій",
)
def dataset_curves(
    ds: str,
    ids: str = Query(
        ...,
        description="Список id через кому, наприклад LR|SMOTE,GB|Без балансування.",
    ),
) -> list[CurveBundle]:
    raw_ids = [part.strip() for part in ids.split(",") if part.strip()]
    if not raw_ids:
        raise HTTPException(status_code=422, detail="Параметр ids не може бути порожнім.")
    bundles: list[CurveBundle] = []
    for raw in raw_ids:
        algo, method = parse_config_id(raw)
        config = cache.get_config(ds, algo, method)
        bundles.append(
            CurveBundle(algo=config.algo, method=config.method, roc=config.roc, pr=config.pr)
        )
    return bundles


@router.get(
    "/{ds}/importance",
    response_model=ImportanceResponse,
    summary="Permutation importance для best або baseline",
)
def dataset_importance(
    ds: str,
    which: ImportanceWhich = Query("best", description="best або baseline."),
) -> ImportanceResponse:
    results = cache.get_results(ds)
    ref = results.best if which == "best" else results.baseline
    values = results.importance.best if which == "best" else results.importance.baseline
    return ImportanceResponse(
        which=which,
        algo=ref.algo,
        method=ref.method,
        values=values,
    )
