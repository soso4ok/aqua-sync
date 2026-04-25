from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.alert import Alert, AlertStatus
from app.models.user import User
from app.schemas.alert import AlertRead, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRead])
async def list_alerts(
    skip: int = 0,
    limit: int = 50,
    status: AlertStatus | None = None,
    session: AsyncSession = Depends(get_db),
):
    q = select(Alert)
    if status:
        q = q.where(Alert.status == status)
    q = q.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    rows = await session.scalars(q)
    return list(rows.all())


@router.patch("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: int,
    body: AlertUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
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
