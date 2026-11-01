"""Occlusion-based explanation of a single-patient score."""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.models import score as pipeline_score


def occlusion_contributions(
    pipeline: Any,
    patient: pd.DataFrame,
    baselines: dict[str, Any],
) -> list[dict[str, float | str]]:
    """Replace each raw feature with the train median/mode and measure score drop.

    ``delta = score_original - score_occluded``. A positive delta means the
    original feature value increases predicted stroke risk relative to the
    typical training value.
    """
    if len(patient) != 1:
        raise ValueError("Occlusion explanation expects a single-row frame.")

    original = float(pipeline_score(pipeline, patient)[0])
    contributions: list[dict[str, float | str]] = []
    for feature, fill_value in baselines.items():
        occluded = patient.copy()
        occluded.iloc[0, occluded.columns.get_loc(feature)] = fill_value
        occluded_score = float(pipeline_score(pipeline, occluded)[0])
        contributions.append(
            {"feature": str(feature), "delta": original - occluded_score}
        )
    contributions.sort(key=lambda row: abs(float(row["delta"])), reverse=True)
    return contributions
