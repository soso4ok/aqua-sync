from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.report import PollutionType, TrustLevel

HIGH_ACCURACY_THRESHOLD_M = 5.0


class ReportCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    gnss_accuracy_m: float = Field(..., gt=0, description="Real accuracy in metres returned by device")
    description: Optional[str] = None
    captured_at: Optional[datetime] = None
    # Tags from PWA (algae, chemical, trash, fish, pipe, smell)
    tags: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def derive_is_high_accuracy(self):
        self.is_high_accuracy = self.gnss_accuracy_m < HIGH_ACCURACY_THRESHOLD_M
        return self

    is_high_accuracy: bool = False


class ReportRead(BaseModel):
    id: int
    latitude: float = 0.0
    longitude: float = 0.0
    gnss_accuracy_m: Optional[float]
    is_high_accuracy: bool = False
    description: Optional[str]
    photo_url: Optional[str] = None
    pollution_type: PollutionType
    trust_level: TrustLevel
    ai_verdict: Optional[str]
    submitted_at: datetime
    points_awarded: int = 0

    model_config = {"from_attributes": True}
