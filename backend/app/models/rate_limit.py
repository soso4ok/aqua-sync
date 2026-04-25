from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class RateLimit(Base):
    __tablename__ = "rate_limits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    next_allowed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    backoff_seconds: Mapped[float] = mapped_column(Float, default=1.0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
