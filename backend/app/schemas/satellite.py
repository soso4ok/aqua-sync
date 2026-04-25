from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SentinelSceneMetadata(BaseModel):
    scene_id: str
    scene_date: datetime
    cloud_coverage_pct: Optional[float] = None
    bbox: list[float]


class AnomalyPolygonRead(BaseModel):
    id: int
    ndwi_max: Optional[float]
    chlorophyll_a: Optional[float]
    cyanobacteria: Optional[float]
    turbidity: Optional[float]
    sentinel_scene_id: Optional[str]
    detected_at: datetime
    scene_date: Optional[datetime]
    geojson: Optional[dict] = None

    model_config = {"from_attributes": True}


class SatelliteIngestRequest(BaseModel):
    bbox: list[float] = Field(default=[22.0, 49.5, 26.0, 51.5], description="[min_lon, min_lat, max_lon, max_lat]")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


from pydantic import Field  # noqa: E402 — re-import needed after Field reference above
