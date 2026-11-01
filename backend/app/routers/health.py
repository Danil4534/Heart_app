"""Liveness endpoint."""

from fastapi import APIRouter

from app.artifacts import cache
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Перевірка стану сервісу",
)
def health() -> HealthResponse:
    """Повертає статус і перелік завантажених наборів даних."""
    return HealthResponse(status="ok", datasets=cache.dataset_tags())
