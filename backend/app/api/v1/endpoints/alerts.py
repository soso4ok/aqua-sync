from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.alert import Alert, AlertStatus
from app.schemas.alert import AlertRead, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRead])
async def list_alerts(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
):
    """Повертає список алертів для Admin Dashboard (найновіші спочатку)."""
    rows = await session.scalars(
        select(Alert).order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    )
    return list(rows.all())


@router.patch("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: int,
    body: AlertUpdate,
    session: AsyncSession = Depends(get_db),
):
    """Оновити статус або нотатки алерту. При переході в RESOLVED — проставляє resolved_at."""
    alert = await session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if body.status is not None:
        alert.status = body.status
        if body.status == AlertStatus.RESOLVED:
            alert.resolved_at = datetime.now(timezone.utc)

    if body.notes is not None:
        alert.notes = body.notes

    await session.commit()
    await session.refresh(alert)
    return alert


@router.websocket("/ws")
async def alerts_websocket(websocket: WebSocket):
    """Real-time alert stream for the Admin Dashboard."""
    raise NotImplementedError
