from sqlalchemy.ext.asyncio import AsyncSession


class SpatialFusionService:
    """Core Space-to-Citizen fusion logic: ST_Intersects report GPS point with anomaly polygons."""

    async def find_intersecting_anomalies(
        self,
        session: AsyncSession,
        longitude: float,
        latitude: float,
        hours_lookback: int = 48,
    ) -> list[int]:
        """Returns list of anomaly_polygon IDs that intersect the given point."""
        raise NotImplementedError

    async def create_alert_if_match(
        self,
        session: AsyncSession,
        report_id: int,
        anomaly_ids: list[int],
    ) -> list[int]:
        """Creates Alert records and returns their IDs."""
        raise NotImplementedError
