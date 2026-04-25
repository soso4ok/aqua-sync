from datetime import datetime
from enum import Enum as PyEnum

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TrustLevel(str, PyEnum):
    HIGH = "HIGH"
    LOW = "LOW"
    EVIDENCE_VOID = "EVIDENCE_VOID"
    PENDING = "PENDING"


class PollutionType(str, PyEnum):
    OIL_SLICK = "OIL_SLICK"
    ALGAL_BLOOM = "ALGAL_BLOOM"
    FOAM = "FOAM"
    DISCOLORATION = "DISCOLORATION"
    DEBRIS = "DEBRIS"
    UNKNOWN = "UNKNOWN"


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # GPS point — SRID 4326 (WGS84)
    location: Mapped[object] = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    gnss_accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    pollution_type: Mapped[PollutionType] = mapped_column(
        Enum(PollutionType), default=PollutionType.UNKNOWN
    )
    trust_level: Mapped[TrustLevel] = mapped_column(
        Enum(TrustLevel), default=TrustLevel.PENDING
    )
    ai_verdict: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
