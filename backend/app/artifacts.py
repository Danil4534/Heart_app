"""In-memory artifact cache: JSON at startup, joblib models on demand."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import HTTPException
from sklearn.model_selection import train_test_split

from app.config import ARTIFACTS_DIR, FEATURE_COLUMNS, NUMERIC_FEATURES, SEED, TEST_SIZE
from app.data import load_dataset
from app.schemas import ConfigResult, ResultsFile


def config_id(algo: str, method: str) -> str:
    """Stable id used in query params and ``model_id`` (``LR|SMOTE``)."""
    return f"{algo}|{method}"


def parse_config_id(raw: str) -> tuple[str, str]:
    """Split ``algo|method`` on the first pipe."""
    if "|" not in raw:
        raise HTTPException(
            status_code=404,
            detail=f"Невідомий model_id {raw!r}. Очікується 'best', 'baseline' або 'Алгоритм|Метод'.",
        )
    algo, method = raw.split("|", 1)
    return algo, method


class ArtifactCache:
    """Dataset results, train baselines, and lazily loaded joblib pipelines."""

    def __init__(self) -> None:
        self.directory: Path = ARTIFACTS_DIR
        self.results: dict[str, ResultsFile] = {}
        self.baselines: dict[str, dict[str, Any]] = {}
        self.feature_columns: dict[str, list[str]] = {}
        self._pipelines: dict[Path, Any] = {}

    def load(self, directory: Path | None = None) -> None:
        """Read ``*_results.json`` and precompute train medians/modes."""
        self.clear()
        self.directory = Path(directory) if directory is not None else ARTIFACTS_DIR
        if not self.directory.exists():
            return
        for path in sorted(self.directory.glob("*_results.json")):
            tag = path.name.removesuffix("_results.json")
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.results[tag] = ResultsFile.model_validate(payload)
            self._load_baselines(tag)

    def clear(self) -> None:
        self.results = {}
        self.baselines = {}
        self.feature_columns = {}
        self._pipelines = {}

    def dataset_tags(self) -> list[str]:
        return sorted(self.results)

    def get_results(self, tag: str) -> ResultsFile:
        try:
            return self.results[tag]
        except KeyError as exc:
            raise HTTPException(
                status_code=404,
                detail=f"Невідомий набір даних {tag!r}.",
            ) from exc

    def get_config(self, tag: str, algo: str, method: str) -> ConfigResult:
        results = self.get_results(tag)
        for config in results.configs:
            if config.algo == algo and config.method == method:
                return config
        raise HTTPException(
            status_code=404,
            detail=f"Конфігурацію {config_id(algo, method)} не знайдено для {tag}.",
        )

    def resolve_model(self, tag: str, model_id: str) -> tuple[str, str, ConfigResult]:
        """Map ``best`` / ``baseline`` / ``algo|method`` to a saved config."""
        results = self.get_results(tag)
        if model_id == "best":
            algo, method = results.best.algo, results.best.method
        elif model_id == "baseline":
            algo, method = results.baseline.algo, results.baseline.method
        else:
            algo, method = parse_config_id(model_id)
        config = self.get_config(tag, algo, method)
        if not config.model_file:
            raise HTTPException(
                status_code=404,
                detail=f"Модель {model_id!r} для {tag} не збережено (немає файлу joblib).",
            )
        return algo, method, config

    def get_pipeline(self, tag: str, model_id: str) -> Any:
        """Load a joblib pipeline, caching by file path."""
        _algo, _method, config = self.resolve_model(tag, model_id)
        assert config.model_file is not None
        path = (self.directory / config.model_file).resolve()
        if not path.is_file():
            raise HTTPException(
                status_code=404,
                detail=f"Файл моделі {config.model_file} не знайдено.",
            )
        if path not in self._pipelines:
            self._pipelines[path] = joblib.load(path)
        return self._pipelines[path]

    def list_predict_models(self) -> list[dict[str, str]]:
        """best, baseline, and every config that has a joblib file."""
        items: list[dict[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for tag, results in sorted(self.results.items()):
            for kind, ref in (("best", results.best), ("baseline", results.baseline)):
                config = self.get_config(tag, ref.algo, ref.method)
                if not config.model_file:
                    continue
                key = (tag, kind)
                if key in seen:
                    continue
                seen.add(key)
                items.append(
                    {
                        "dataset": tag,
                        "model_id": kind,
                        "algo": ref.algo,
                        "method": ref.method,
                        "kind": kind,
                    }
                )
            for config in results.configs:
                if not config.model_file:
                    continue
                cid = config_id(config.algo, config.method)
                key = (tag, cid)
                if key in seen:
                    continue
                seen.add(key)
                items.append(
                    {
                        "dataset": tag,
                        "model_id": cid,
                        "algo": config.algo,
                        "method": config.method,
                        "kind": "saved",
                    }
                )
        return items

    def _load_baselines(self, tag: str) -> None:
        try:
            x, y = load_dataset(tag)
        except (KeyError, FileNotFoundError, ValueError):
            self.baselines[tag] = {}
            self.feature_columns[tag] = list(FEATURE_COLUMNS)
            return
        x_train, _x_test, _y_train, _y_test = train_test_split(
            x, y, test_size=TEST_SIZE, stratify=y, random_state=SEED
        )
        fills: dict[str, Any] = {}
        for column in x_train.columns:
            series = x_train[column]
            if column in NUMERIC_FEATURES or pd.api.types.is_numeric_dtype(series):
                fills[column] = series.median()
            else:
                mode = series.mode(dropna=True)
                fills[column] = mode.iloc[0] if not mode.empty else series.iloc[0]
        self.baselines[tag] = fills
        self.feature_columns[tag] = list(x_train.columns)


cache = ArtifactCache()
