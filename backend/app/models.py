"""Classifier factory, imblearn pipelines, fit/score helpers."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from imblearn.over_sampling import ADASYN, SMOTE, BorderlineSMOTE
from imblearn.pipeline import Pipeline
from lightgbm import LGBMClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.utils.class_weight import compute_sample_weight

from app.config import SEED, WEIGHT_METHOD
from app.preprocessing import preprocessing_steps


def _class_weight(algo: str, method: str) -> str | None:
    if method != WEIGHT_METHOD:
        return None
    if algo in {"LR", "SVM"}:
        return "balanced"
    if algo == "RF":
        return "balanced_subsample"
    return None


def _scale_pos_weight(y_train: pd.Series | np.ndarray, method: str) -> float:
    if method != WEIGHT_METHOD:
        return 1.0
    y = np.asarray(y_train)
    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())
    if n_pos == 0:
        return 1.0
    return n_neg / n_pos


def make_classifier(
    algo: str,
    method: str,
    y_train: pd.Series | np.ndarray,
) -> Any:
    """Build an unfitted classifier for ``algo`` / balancing ``method``."""
    class_weight = _class_weight(algo, method)
    if algo == "LR":
        return LogisticRegression(
            max_iter=3000,
            class_weight=class_weight,
            random_state=SEED,
        )
    if algo == "SVM":
        return SVC(
            kernel="rbf",
            C=1.0,
            gamma="scale",
            class_weight=class_weight,
            random_state=SEED,
        )
    if algo == "RF":
        return RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=2,
            n_jobs=-1,
            class_weight=class_weight,
            random_state=SEED,
        )
    if algo == "GB":
        return GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=3,
            random_state=SEED,
        )
    if algo == "LightGBM":
        return LGBMClassifier(
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            verbose=-1,
            scale_pos_weight=_scale_pos_weight(y_train, method),
            random_state=SEED,
        )
    raise ValueError(f"Unknown algorithm {algo!r}.")


def make_sampler(method: str) -> SMOTE | ADASYN | BorderlineSMOTE | None:
    """Return an oversampler step, or ``None`` when sampling is not used."""
    if method == "SMOTE":
        return SMOTE(random_state=SEED)
    if method == "ADASYN":
        return ADASYN(random_state=SEED)
    if method == "Borderline-SMOTE":
        return BorderlineSMOTE(random_state=SEED)
    return None


def build_pipeline(
    algo: str,
    method: str,
    y_train: pd.Series | np.ndarray,
) -> Pipeline:
    """Assemble an imblearn Pipeline: preprocess → optional sampler → clf."""
    steps: list[tuple[str, Any]] = list(preprocessing_steps())
    sampler = make_sampler(method)
    if sampler is not None:
        steps.append(("sampler", sampler))
    steps.append(("clf", make_classifier(algo, method, y_train)))
    return Pipeline(steps)


def fit_pipeline(
    pipeline: Pipeline,
    x: pd.DataFrame,
    y: pd.Series | np.ndarray,
    algo: str,
    method: str,
) -> Pipeline:
    """Fit ``pipeline``. GB + class weighting uses balanced ``sample_weight``."""
    if algo == "GB" and method == WEIGHT_METHOD:
        sample_weight = compute_sample_weight(class_weight="balanced", y=y)
        return pipeline.fit(x, y, clf__sample_weight=sample_weight)
    return pipeline.fit(x, y)


def score(pipeline: Pipeline, x: pd.DataFrame) -> np.ndarray:
    """Positive-class scores: ``predict_proba`` or ``decision_function``."""
    clf = pipeline.named_steps["clf"]
    if hasattr(clf, "predict_proba"):
        proba = pipeline.predict_proba(x)
        return np.asarray(proba[:, 1], dtype=float)
    return np.asarray(pipeline.decision_function(x), dtype=float)
