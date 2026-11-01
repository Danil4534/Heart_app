"""Saved-model listing and single-patient prediction."""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter

from app.artifacts import cache
from app.config import CLASSIFICATION_THRESHOLD, DISCLAIMER, FEATURE_COLUMNS
from app.explain import occlusion_contributions
from app.models import score as pipeline_score
from app.schemas import (
    Patient,
    PredictModelInfo,
    PredictRequest,
    PredictResponse,
)

router = APIRouter(prefix="/api", tags=["predict"])


def _patient_frame(patient: Patient, columns: list[str]) -> pd.DataFrame:
    payload = patient.model_dump()
    ordered = columns if columns else list(FEATURE_COLUMNS)
    return pd.DataFrame([{col: payload[col] for col in ordered}])


def _is_svm(algo: str) -> bool:
    return algo == "SVM"


@router.get(
    "/models",
    response_model=list[PredictModelInfo],
    summary="Моделі, доступні для прогнозу",
)
def list_models() -> list[PredictModelInfo]:
    """best, baseline та всі збережені joblib-файли."""
    return [PredictModelInfo.model_validate(row) for row in cache.list_predict_models()]


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Прогноз ризику інсульту для одного пацієнта",
)
def predict(request: PredictRequest) -> PredictResponse:
    """Повертає клас, score/ймовірність та occlusion-внески ознак."""
    algo, method, _config = cache.resolve_model(request.dataset, request.model_id)
    pipeline = cache.get_pipeline(request.dataset, request.model_id)
    columns = cache.feature_columns.get(request.dataset, list(FEATURE_COLUMNS))
    frame = _patient_frame(request.patient, columns)

    scores = pipeline_score(pipeline, frame)
    raw_score = float(scores[0])
    clf = pipeline.named_steps["clf"]
    if _is_svm(algo) or not hasattr(clf, "predict_proba"):
        probability = None
        predicted = int(pipeline.predict(frame)[0])
    else:
        probability = raw_score
        predicted = int(raw_score >= CLASSIFICATION_THRESHOLD)

    baselines = cache.baselines.get(request.dataset, {})
    if not baselines:
        baselines = {
            column: frame.iloc[0][column] for column in frame.columns
        }
    contributions = occlusion_contributions(pipeline, frame, baselines)

    return PredictResponse(
        risk_class="high" if predicted == 1 else "low",
        probability=probability,
        score=raw_score,
        model={"algo": algo, "method": method},
        contributions=[
            {"feature": str(row["feature"]), "delta": float(row["delta"])}
            for row in contributions
        ],
        disclaimer=DISCLAIMER,
    )
