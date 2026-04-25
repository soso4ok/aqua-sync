from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import router as v1_router
from app.core.exceptions import AquaSyncException, aquasync_exception_handler
from app.worker.scheduler import AquaSyncScheduler

_scheduler = AquaSyncScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _scheduler.start()
    yield
    _scheduler.shutdown()


app = FastAPI(
    title="AquaSync API",
    description="Space-to-Citizen water quality monitoring platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AquaSyncException, aquasync_exception_handler)
app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
