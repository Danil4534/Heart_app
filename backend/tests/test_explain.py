"""Occlusion explanation unit tests."""

from __future__ import annotations

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.explain import occlusion_contributions


class _Wrap:
    """Minimal object with ``named_steps['clf']`` for ``app.models.score``."""

    def __init__(self, pipeline: Pipeline) -> None:
        self.named_steps = {"clf": pipeline.named_steps["clf"]}
        self._pipeline = pipeline

    def predict_proba(self, x: pd.DataFrame):
        return self._pipeline.predict_proba(x)


def test_occlusion_positive_delta_means_higher_risk() -> None:
    frame = pd.DataFrame(
        {
            "age": [80.0, 20.0, 40.0, 30.0],
            "bmi": [40.0, 22.0, 25.0, 24.0],
        }
    )
    y = pd.Series([1, 0, 0, 0])
    sklearn_pipe = Pipeline(
        [("scale", StandardScaler()), ("clf", LogisticRegression(random_state=0))]
    )
    sklearn_pipe.fit(frame, y)
    wrapped = _Wrap(sklearn_pipe)

    patient = pd.DataFrame([{"age": 80.0, "bmi": 40.0}])
    baselines = {"age": 30.0, "bmi": 24.0}
    contribs = occlusion_contributions(wrapped, patient, baselines)
    features = [row["feature"] for row in contribs]
    assert set(features) == {"age", "bmi"}
    abs_deltas = [abs(float(row["delta"])) for row in contribs]
    assert abs_deltas == sorted(abs_deltas, reverse=True)
    age_delta = next(float(row["delta"]) for row in contribs if row["feature"] == "age")
    assert age_delta > 0
