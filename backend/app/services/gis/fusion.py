from datetime import datetime, timedelta, timezone

from geoalchemy2.functions import ST_Intersects, ST_MakePoint, ST_SetSRID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.anomaly import AnomalyPolygon


class SpatialFusionService:
    """Core Space-to-Citizen fusion logic: ST_Intersects report GPS point with anomaly polygons."""

    async def find_intersecting_anomalies(
        self,
        session: AsyncSession,
        longitude: float,
        latitude: float,
        hours_lookback: int = 48,
    ) -> list[int]:
        """Returns anomaly_polygon IDs whose geometry intersects the given GPS point.

        Only considers anomalies detected within the last `hours_lookback` hours
        to avoid matching stale satellite data.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours_lookback)

        # Build PostGIS point from citizen GPS coords (SRID 4326 = WGS84)
        point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)

        rows = await session.scalars(
            select(AnomalyPolygon.id).where(
                ST_Intersects(AnomalyPolygon.geom, point),
                AnomalyPolygon.detected_at >= cutoff,
            )
        )
        return list(rows.all())

    async def create_alert_if_match(
        self,
        session: AsyncSession,
        report_id: int,
        anomaly_ids: list[int],
    ) -> list[int]:
        """Creates Alert records for each matching anomaly. Returns created alert IDs.

        Each alert starts as HIGH severity / OPEN status — the Admin Dashboard
        can later acknowledge or resolve via PATCH /alerts/{id}.
        """
        if not anomaly_ids:
            return []

        alert_ids: list[int] = []
        for anomaly_id in anomaly_ids:
            alert = Alert(
                report_id=report_id,
                anomaly_id=anomaly_id,
                severity=AlertSeverity.HIGH,
                status=AlertStatus.OPEN,
            )
            session.add(alert)
            await session.flush()
            alert_ids.append(alert.id)

        await session.commit()
        return alert_ids
