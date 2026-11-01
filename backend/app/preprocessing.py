"""Shared preprocessing steps for imblearn pipelines (no nested Pipelines)."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from app.config import BINARY_PASSTHROUGH, CATEGORICAL, NUMERIC_IMPUTE, NUMERIC_SCALE

_BMI_BINS = [-np.inf, 18.5, 25.0, 30.0, np.inf]
_BMI_LABELS = ["under", "normal", "over", "obese"]


def add_bmi_category(x: pd.DataFrame | np.ndarray) -> pd.DataFrame:
    """Add ``bmi_cat`` from WHO BMI cut-points as a string column."""
    frame = x if isinstance(x, pd.DataFrame) else pd.DataFrame(x)
    out = frame.copy()
    out["bmi_cat"] = (
        pd.cut(out["bmi"], bins=_BMI_BINS, labels=_BMI_LABELS).astype(str)
    )
    return out


def _bmi_cat_feature_names_out(
    _transformer: FunctionTransformer,
    input_features: list[str] | np.ndarray,
) -> np.ndarray:
    names = [str(name) for name in input_features]
    if "bmi_cat" not in names:
        names.append("bmi_cat")
    return np.asarray(names, dtype=object)


def build_imputer() -> ColumnTransformer:
    """Median-impute numeric columns; passthrough the rest (pandas output)."""
    return ColumnTransformer(
        transformers=[
            ("impute", SimpleImputer(strategy="median"), list(NUMERIC_IMPUTE)),
        ],
        remainder="passthrough",
        verbose_feature_names_out=False,
    ).set_output(transform="pandas")


def build_bmi_category_step() -> FunctionTransformer:
    """FunctionTransformer that appends ``bmi_cat``."""
    return FunctionTransformer(
        add_bmi_category,
        validate=False,
        feature_names_out=_bmi_cat_feature_names_out,
    )


def build_encoder() -> ColumnTransformer:
    """Scale numerics, passthrough binaries, one-hot encode categoricals."""
    return ColumnTransformer(
        transformers=[
            ("scale", StandardScaler(), list(NUMERIC_SCALE)),
            ("pass", "passthrough", list(BINARY_PASSTHROUGH)),
            (
                "ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                list(CATEGORICAL),
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    ).set_output(transform="pandas")


def preprocessing_steps() -> list[tuple[str, Any]]:
    """Named preprocessing steps for an imblearn ``Pipeline`` (no nesting)."""
    return [
        ("impute", build_imputer()),
        ("bmi_cat", build_bmi_category_step()),
        ("encode", build_encoder()),
    ]


def preprocessing_catalog() -> list[dict[str, Any]]:
    """Static table of preprocessing stages for the API (Ukrainian copy)."""
    return [
        {
            "step": 1,
            "name": "Імпутація числових ознак",
            "transformer": "ColumnTransformer + SimpleImputer(strategy='median')",
            "columns": list(NUMERIC_IMPUTE),
            "description": (
                "Пропуски в age, avg_glucose_level та bmi заповнюються медіаною, "
                "обчисленою лише на навчальній частині. Решта колонок проходить без змін "
                "(remainder='passthrough', set_output='pandas')."
            ),
        },
        {
            "step": 2,
            "name": "Категорія ІМТ",
            "transformer": "FunctionTransformer",
            "columns": ["bmi", "bmi_cat"],
            "description": (
                "Додається рядок bmi_cat = pd.cut(bmi, [-inf, 18.5, 25, 30, inf]) "
                "з мітками under, normal, over, obese."
            ),
        },
        {
            "step": 3,
            "name": "Масштабування та кодування",
            "transformer": "ColumnTransformer + StandardScaler + OneHotEncoder",
            "columns": {
                "scale": list(NUMERIC_SCALE),
                "passthrough": list(BINARY_PASSTHROUGH),
                "one_hot": list(CATEGORICAL),
            },
            "description": (
                "StandardScaler для age, avg_glucose_level, bmi; passthrough для "
                "hypertension і heart_disease; OneHotEncoder(handle_unknown='ignore') "
                "для gender, ever_married, work_type, Residence_type, smoking_status, bmi_cat."
            ),
        },
    ]
