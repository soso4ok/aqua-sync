from fastapi import APIRouter, Depends, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.alert import AlertRead, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRead])
async def list_alerts(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
):
    raise NotImplementedError


@router.patch("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: int,
    body: AlertUpdate,
    session: AsyncSession = Depends(get_db),
):
    raise NotImplementedError


@router.websocket("/ws")
async def alerts_websocket(websocket: WebSocket):
    """Real-time alert stream for the Admin Dashboard."""
    raise NotImplementedError
