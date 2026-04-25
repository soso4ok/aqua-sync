from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertStatus


class AlertRead(BaseModel):
    id: int
    report_id: int
    anomaly_id: int
    severity: AlertSeverity
    status: AlertStatus
    notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    notes: Optional[str] = None


class AlertWebSocketPayload(BaseModel):
    event: str = "new_alert"
    alert: AlertRead
