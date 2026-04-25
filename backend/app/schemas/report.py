from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.report import PollutionType, TrustLevel


class ReportCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    gnss_accuracy_m: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    captured_at: Optional[datetime] = None


class ReportRead(BaseModel):
    id: int
    latitude: float
    longitude: float
    gnss_accuracy_m: Optional[float]
    description: Optional[str]
    pollution_type: PollutionType
    trust_level: TrustLevel
    ai_verdict: Optional[str]
    submitted_at: datetime

    model_config = {"from_attributes": True}
