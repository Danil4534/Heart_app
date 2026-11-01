"""Paths, seed, and experiment constants."""

from __future__ import annotations

from pathlib import Path

SEED = 42

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "data"
ARTIFACTS_DIR = BACKEND_ROOT / "artifacts"

DATASETS: dict[str, Path] = {
    "ds1": DATA_DIR / "stroke1.csv",
    "ds2": DATA_DIR / "stroke2.csv",
}

ALGORITHMS: tuple[str, ...] = ("LR", "SVM", "RF", "GB", "LightGBM")
METHODS: tuple[str, ...] = (
    "Без балансування",
    "Зважування класів",
    "SMOTE",
    "ADASYN",
    "Borderline-SMOTE",
)
NONE_METHOD = "Без балансування"
WEIGHT_METHOD = "Зважування класів"

METHOD_SLUGS: dict[str, str] = {
    "Без балансування": "none",
    "Зважування класів": "class_weight",
    "SMOTE": "smote",
    "ADASYN": "adasyn",
    "Borderline-SMOTE": "borderline_smote",
}

NUMERIC_IMPUTE: tuple[str, ...] = ("age", "avg_glucose_level", "bmi")
NUMERIC_SCALE: tuple[str, ...] = ("age", "avg_glucose_level", "bmi")
BINARY_PASSTHROUGH: tuple[str, ...] = ("hypertension", "heart_disease")
CATEGORICAL: tuple[str, ...] = (
    "gender",
    "ever_married",
    "work_type",
    "Residence_type",
    "smoking_status",
    "bmi_cat",
)
TARGET = "stroke"

METRIC_NAMES: tuple[str, ...] = (
    "precision",
    "recall",
    "f1",
    "roc_auc",
    "pr_auc",
    "mcc",
    "accuracy",
)
RANK_METRICS: tuple[str, ...] = ("recall", "f1", "pr_auc")

CV_FOLDS = 5
TEST_SIZE = 0.2
MAX_CURVE_POINTS = 200
PERM_REPEATS = 30
CLASSIFICATION_THRESHOLD = 0.5

CORS_ORIGINS: tuple[str, ...] = ("http://localhost:5173",)

FEATURE_COLUMNS: tuple[str, ...] = (
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "ever_married",
    "work_type",
    "Residence_type",
    "avg_glucose_level",
    "bmi",
    "smoking_status",
)

NUMERIC_FEATURES: tuple[str, ...] = ("age", "avg_glucose_level", "bmi")
CATEGORICAL_FEATURES: tuple[str, ...] = (
    "gender",
    "hypertension",
    "heart_disease",
    "ever_married",
    "work_type",
    "Residence_type",
    "smoking_status",
)

DISCLAIMER = (
    "Цей прогноз є допоміжним інструментом і не замінює консультацію лікаря. "
    "Рішення щодо діагностики та лікування має ухвалювати фахівець."
)

MATRIX_METRICS: tuple[str, ...] = METRIC_NAMES
DELTA_METRICS: tuple[str, ...] = ("recall", "f1", "pr_auc", "roc_auc")
