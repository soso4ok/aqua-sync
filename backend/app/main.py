from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.api import router as v1_router
from app.core.config import settings
from app.core.exceptions import AquaSyncException, aquasync_exception_handler
from app.worker.scheduler import AquaSyncScheduler

_scheduler = AquaSyncScheduler()
limiter = Limiter(key_func=get_remote_address)


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AquaSyncException, aquasync_exception_handler)
app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
