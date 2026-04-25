from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AnomalyPolygon(Base):
    __tablename__ = "anomaly_polygons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # PostGIS polygon — SRID 4326
    geom: Mapped[object] = mapped_column(Geometry("POLYGON", srid=4326), nullable=False)

    ndwi_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    chlorophyll_a: Mapped[float | None] = mapped_column(Float, nullable=True)
    cyanobacteria: Mapped[float | None] = mapped_column(Float, nullable=True)
    turbidity: Mapped[float | None] = mapped_column(Float, nullable=True)

    sentinel_scene_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    scene_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
