"""
Seed mock CitizenReports around Lviv/Ukraine for map testing.
Run: docker-compose exec -T backend python scripts/seed_reports.py
"""
import asyncio
import random
from datetime import datetime, timedelta, timezone

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.report import CitizenReport, PollutionType, TrustLevel
from app.models.user import User

MOCK_REPORTS = [
    # Lviv area
    (49.8429, 24.0311, PollutionType.ALGAL_BLOOM,    TrustLevel.HIGH, "Dense green bloom near river bank"),
    (49.8380, 24.0250, PollutionType.OIL_SLICK,      TrustLevel.HIGH, "Rainbow oil sheen on water surface"),
    (49.8510, 24.0450, PollutionType.DEBRIS,         TrustLevel.HIGH, "Plastic waste accumulation"),
    (49.8290, 24.0180, PollutionType.FOAM,           TrustLevel.LOW,  "Unnatural white foam along shore"),
    (49.8600, 24.0600, PollutionType.ALGAL_BLOOM,    TrustLevel.HIGH, "Cyanobacteria visible from bridge"),
    (49.8450, 24.0550, PollutionType.DISCOLORATION,  TrustLevel.LOW,  "Brown discoloration, unknown source"),
    (49.8350, 24.0400, PollutionType.OIL_SLICK,      TrustLevel.HIGH, "Pipe discharging near park"),
    (49.8700, 24.0200, PollutionType.DEBRIS,         TrustLevel.HIGH, "Large trash accumulation after rain"),
    # Kyiv area
    (50.4501, 30.5234, PollutionType.ALGAL_BLOOM,    TrustLevel.HIGH, "Bloom on Dnipro reservoir"),
    (50.4600, 30.5100, PollutionType.OIL_SLICK,      TrustLevel.LOW,  "Possible oil discharge near port"),
    (50.4400, 30.5400, PollutionType.FOAM,           TrustLevel.HIGH, "Industrial foam upstream"),
    (50.4550, 30.5300, PollutionType.DEBRIS,         TrustLevel.HIGH, "Post-flood plastic debris"),
    # Odesa area
    (46.4825, 30.7233, PollutionType.ALGAL_BLOOM,    TrustLevel.HIGH, "Sea bloom near harbor"),
    (46.4700, 30.7100, PollutionType.DISCOLORATION,  TrustLevel.LOW,  "Unusual red-brown coloring"),
    (46.4900, 30.7400, PollutionType.OIL_SLICK,      TrustLevel.HIGH, "Tanker spill reported offshore"),
]


async def seed():
    async with AsyncSessionLocal() as session:
        # Use first user or None
        user = await session.scalar(select(User).limit(1))
        user_id = user.id if user else None

        existing = await session.scalar(select(CitizenReport).limit(1))
        if existing:
            count = len((await session.scalars(select(CitizenReport))).all())
            if count >= 10:
                print(f"Already have {count} reports, skipping seed.")
                return

        for i, (lat, lng, p_type, trust, desc) in enumerate(MOCK_REPORTS):
            # Slight random offset so points don't stack exactly
            lat += random.uniform(-0.003, 0.003)
            lng += random.uniform(-0.003, 0.003)
            accuracy = random.choice([2.1, 3.4, 4.8, 8.2, 15.6, 18.0])
            days_ago = random.randint(0, 14)

            report = CitizenReport(
                user_id=user_id,
                location=from_shape(Point(lng, lat), srid=4326),
                gnss_accuracy_m=accuracy,
                description=desc,
                pollution_type=p_type,
                trust_level=trust,
                ai_verdict=f"MOCK | AI (9{random.randint(0,9)}%): {desc}",
                submitted_at=datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23)),
            )
            session.add(report)

        await session.commit()
        print(f"Seeded {len(MOCK_REPORTS)} mock reports.")


if __name__ == "__main__":
    asyncio.run(seed())
