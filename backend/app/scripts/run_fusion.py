import asyncio
from geoalchemy2.shape import to_shape
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.report import CitizenReport
from app.services.gis.fusion import SpatialFusionService


async def run():
    async with AsyncSessionLocal() as session:
        reports = (await session.scalars(select(CitizenReport))).all()
        fusion = SpatialFusionService()
        count = 0
        for r in reports:
            pt = to_shape(r.location)
            ids = await fusion.find_intersecting_anomalies(session, pt.x, pt.y)
            if ids:
                await fusion.create_alert_if_match(session, r.id, ids)
                count += 1
        print(f"Created alerts for {count} reports")


asyncio.run(run())
