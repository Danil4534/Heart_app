"""Dataset cleaning tests."""

from __future__ import annotations

import pandas as pd

from app.data import load_dataset


def test_ds1_cleaning_drops_id_and_other_gender() -> None:
    x, y = load_dataset("ds1")
    assert "id" not in x.columns
    assert "stroke" not in x.columns
    if "gender" in x.columns:
        assert not (x["gender"] == "Other").any()
    assert len(x) == len(y)
    assert len(x) == 5109
    assert int(y.sum()) == 249


def test_ds2_cleaning() -> None:
    x, y = load_dataset("ds2")
    assert "id" not in x.columns
    if "gender" in x.columns:
        assert not (x["gender"] == "Other").any()
    assert len(x) == 4981
    assert int(y.sum()) == 248


def test_cleaned_frame_has_no_duplicate_rows() -> None:
    x, y = load_dataset("ds1")
    frame = pd.concat([x, y.rename("stroke")], axis=1)
    assert frame.duplicated().sum() == 0
