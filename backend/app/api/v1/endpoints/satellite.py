from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_admin
from app.models.user import User
from app.schemas.satellite import AnomalyPolygonRead, SatelliteIngestRequest

router = APIRouter(prefix="/satellite", tags=["satellite"])


@router.post("/ingest", status_code=202)
async def trigger_ingest(
    body: SatelliteIngestRequest,
    _admin: User = Depends(get_current_admin),
):
    """Manually queue a satellite ingestion job (admin only)."""
    raise NotImplementedError


@router.get("/anomalies", response_model=list[AnomalyPolygonRead])
async def list_anomalies(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db),
):
    raise NotImplementedError


@router.get("/anomalies/{anomaly_id}", response_model=AnomalyPolygonRead)
async def get_anomaly(anomaly_id: int, session: AsyncSession = Depends(get_db)):
    raise NotImplementedError
