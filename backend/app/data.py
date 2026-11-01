"""Load and clean stroke datasets."""

from __future__ import annotations

import pandas as pd

from app.config import DATASETS, TARGET


def load_dataset(tag: str) -> tuple[pd.DataFrame, pd.Series]:
    """Load a dataset by tag, drop ``id`` / ``gender==Other`` / duplicates.

    Args:
        tag: ``"ds1"`` (``data/stroke1.csv``) or ``"ds2"`` (``data/stroke2.csv``).

    Returns:
        Feature frame ``X`` and target series ``y`` (stroke, int) after cleaning.

    Raises:
        KeyError: If ``tag`` is not a known dataset.
        FileNotFoundError: If the CSV is missing.
        ValueError: If the target column is absent.
    """
    try:
        path = DATASETS[tag]
    except KeyError as exc:
        known = ", ".join(sorted(DATASETS))
        raise KeyError(f"Unknown dataset tag {tag!r}. Expected one of: {known}.") from exc

    df = pd.read_csv(path)
    if TARGET not in df.columns:
        raise ValueError(f"Column {TARGET!r} is missing from {path}.")

    if "id" in df.columns:
        df = df.drop(columns=["id"])
    if "gender" in df.columns:
        df = df.loc[df["gender"] != "Other"]
    df = df.drop_duplicates().reset_index(drop=True)

    y = df[TARGET].astype(int)
    x = df.drop(columns=[TARGET])
    return x, y
