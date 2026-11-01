"""Dataset listing and preprocessing catalog."""

from fastapi import APIRouter

from app.artifacts import cache
from app.preprocessing import preprocessing_catalog
from app.schemas import DatasetStats, PreprocessingStep

router = APIRouter(prefix="/api", tags=["datasets"])


@router.get(
    "/datasets",
    response_model=list[DatasetStats],
    summary="Список наборів даних зі статистикою",
)
def list_datasets() -> list[DatasetStats]:
    """Статистика з ``artifacts/{ds}_results.json`` (без вигаданих чисел)."""
    return [cache.results[tag].dataset for tag in cache.dataset_tags()]


@router.get(
    "/datasets/{ds}/preprocessing",
    response_model=list[PreprocessingStep],
    summary="Етапи передобробки ознак",
)
def dataset_preprocessing(ds: str) -> list[PreprocessingStep]:
    """Статичний опис кроків конвеєра. Перевіряє, що набір даних існує."""
    cache.get_results(ds)
    return [PreprocessingStep.model_validate(row) for row in preprocessing_catalog()]
