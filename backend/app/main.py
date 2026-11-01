"""FastAPI application entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.artifacts import cache
from app.routers import datasets, experiments, health, predict


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Load JSON artifacts into memory; joblib models stay lazy."""
    cache.load(config.ARTIFACTS_DIR)
    yield
    cache.clear()


app = FastAPI(
    title="VasculoRisk",
    version="0.1.0",
    description="API для порівняння моделей ризику інсульту та прогнозу для пацієнта.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(config.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(datasets.router)
app.include_router(experiments.router)
app.include_router(predict.router)
