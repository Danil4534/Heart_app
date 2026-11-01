"""Pydantic models for training artifacts and API payloads."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import MAX_CURVE_POINTS, METRIC_NAMES

SourceKind = Literal["cv", "test"]
ImportanceWhich = Literal["best", "baseline"]
RiskClass = Literal["low", "high"]
Gender = Literal["Male", "Female"]
YesNo = Literal["Yes", "No"]
WorkType = Literal["Private", "Self-employed", "Govt_job", "children", "Never_worked"]
ResidenceType = Literal["Urban", "Rural"]
SmokingStatus = Literal["formerly smoked", "never smoked", "smokes", "Unknown"]
BinaryFlag = Literal[0, 1]


class MetricSet(BaseModel):
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    mcc: float
    accuracy: float

    @field_validator(*METRIC_NAMES)
    @classmethod
    def _finite(cls, value: float) -> float:
        if value != value:  # NaN
            raise ValueError("Metric values must be finite.")
        return float(value)


class RocCurve(BaseModel):
    fpr: list[float]
    tpr: list[float]

    @field_validator("tpr")
    @classmethod
    def _same_length(cls, tpr: list[float], info: object) -> list[float]:
        data = getattr(info, "data", {})
        fpr = data.get("fpr")
        if fpr is not None and len(fpr) != len(tpr):
            raise ValueError("roc.fpr and roc.tpr must have the same length.")
        if len(tpr) > MAX_CURVE_POINTS:
            raise ValueError(f"ROC curve longer than {MAX_CURVE_POINTS} points.")
        return tpr


class PrCurve(BaseModel):
    precision: list[float]
    recall: list[float]

    @field_validator("recall")
    @classmethod
    def _same_length(cls, recall: list[float], info: object) -> list[float]:
        data = getattr(info, "data", {})
        precision = data.get("precision")
        if precision is not None and len(precision) != len(recall):
            raise ValueError("pr.precision and pr.recall must have the same length.")
        if len(recall) > MAX_CURVE_POINTS:
            raise ValueError(f"PR curve longer than {MAX_CURVE_POINTS} points.")
        return recall


class ConfigResult(BaseModel):
    algo: str
    method: str
    cv: MetricSet
    cv_std: MetricSet
    test: MetricSet
    cm: list[list[int]]
    roc: RocCurve
    pr: PrCurve
    fit_seconds: float
    model_file: str | None

    @field_validator("cm")
    @classmethod
    def _cm_shape(cls, cm: list[list[int]]) -> list[list[int]]:
        if len(cm) != 2 or any(len(row) != 2 for row in cm):
            raise ValueError("cm must be a 2x2 matrix [[tn, fp], [fn, tp]].")
        return cm


class DatasetStats(BaseModel):
    tag: str
    n: int
    n_pos: int
    ntr: int
    ntr_pos: int
    nte: int
    nte_pos: int
    bmi_missing: int
    class_before_smote: dict[str, int]
    class_after_smote: dict[str, int]


class AlgoMethod(BaseModel):
    algo: str
    method: str


class ImportanceBlock(BaseModel):
    best: dict[str, float]
    baseline: dict[str, float]


class ResultsFile(BaseModel):
    """Schema of ``artifacts/{ds}_results.json``."""

    dataset: DatasetStats
    configs: list[ConfigResult] = Field(min_length=1)
    best: AlgoMethod
    baseline: AlgoMethod
    importance: ImportanceBlock


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    datasets: list[str] = Field(default_factory=list)


class ConfigMetrics(BaseModel):
    algo: str
    method: str
    cv: MetricSet
    cv_std: MetricSet
    test: MetricSet
    cm: list[list[int]]
    fit_seconds: float
    model_file: str | None


class MetricMatrix(BaseModel):
    methods: list[str]
    algos: list[str]
    values: list[list[float | None]]
    metric: str
    source: SourceKind


class DeltaMetrics(BaseModel):
    recall: float
    f1: float
    pr_auc: float
    roc_auc: float


class ExperimentSummary(BaseModel):
    dataset: str
    best: AlgoMethod
    baseline: AlgoMethod
    best_metrics: dict[str, MetricSet]
    baseline_metrics: dict[str, MetricSet]
    deltas: dict[str, DeltaMetrics]


class CurveBundle(BaseModel):
    algo: str
    method: str
    roc: RocCurve
    pr: PrCurve


class ImportanceResponse(BaseModel):
    which: ImportanceWhich
    algo: str
    method: str
    values: dict[str, float]


class PredictModelInfo(BaseModel):
    dataset: str
    model_id: str
    algo: str
    method: str
    kind: str


class Patient(BaseModel):
    """Single-patient feature vector for ``POST /api/predict``."""

    model_config = ConfigDict(str_strip_whitespace=True)

    age: float
    gender: Gender
    hypertension: BinaryFlag
    heart_disease: BinaryFlag
    ever_married: YesNo
    work_type: WorkType
    Residence_type: ResidenceType
    avg_glucose_level: float
    bmi: float
    smoking_status: SmokingStatus

    @field_validator("age")
    @classmethod
    def _age_range(cls, value: float) -> float:
        if value < 0 or value > 120:
            raise ValueError("Вік має бути в межах від 0 до 120 років.")
        return value

    @field_validator("avg_glucose_level")
    @classmethod
    def _glucose_range(cls, value: float) -> float:
        if value < 30 or value > 500:
            raise ValueError("Середній рівень глюкози має бути в межах від 30 до 500.")
        return value

    @field_validator("bmi")
    @classmethod
    def _bmi_range(cls, value: float) -> float:
        if value < 10 or value > 100:
            raise ValueError("ІМТ має бути в межах від 10 до 100.")
        return value


class PredictRequest(BaseModel):
    dataset: str
    model_id: str
    patient: Patient


class Contribution(BaseModel):
    feature: str
    delta: float


class PredictModelRef(BaseModel):
    algo: str
    method: str


class PredictResponse(BaseModel):
    risk_class: RiskClass
    probability: float | None
    score: float
    model: PredictModelRef
    contributions: list[Contribution]
    disclaimer: str


class PreprocessingStep(BaseModel):
    step: int
    name: str
    transformer: str
    columns: Any
    description: str
