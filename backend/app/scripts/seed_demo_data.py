"""
Seed demo data for AquaSync presentation:
  - Keeps 7 most interesting anomaly polygons from the Moroccan lake
  - Creates 13 citizen reports (7 inside polygons → alerts, 6 outside → pure reports)
  - Runs spatial fusion to generate alerts

Usage (from backend/):
    docker exec aquasync_backend python -m app.scripts.seed_demo_data
"""
import asyncio
from datetime import datetime, timezone

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import delete, update, text

from app.db.session import AsyncSessionLocal
from app.models.alert import Alert
from app.models.anomaly import AnomalyPolygon
from app.models.report import CitizenReport, PollutionType, TrustLevel
from app.models.user import User  # noqa: F401 — registers users table in SA metadata
from app.services.gis.fusion import SpatialFusionService

# ── Polygon IDs to KEEP (7 largest / most spatially spread) ──────────────────
# All others will be deleted.
# Coords below are approximate centroids of each polygon (for reference).
#
#  23680  lat=35.812  lng=-3.752   116 km² — main lake body
#  21578  lat=35.880  lng=-3.799   1.7 km² — northern bay
#  21784  lat=35.863  lng=-3.803   1.0 km² — upper cove
#  22667  lat=35.825  lng=-3.796   374 k m² — central zone
#  22438  lat=35.832  lng=-3.779   216 k m² — central-east
#  23296  lat=35.778  lng=-3.812   175 k m² — southern end
#  21571  lat=35.867  lng=-3.776   94  k m² — northeast cove
KEEP_POLYGON_IDS = [23680, 21578, 21784, 22667, 22438, 23296, 21571]

# ── Reports: (lat, lng, pollution_type, trust_level, gnss_accuracy_m,
#              description, photo_hint) ─────────────────────────────────────
#
# INSIDE polygon → will produce an Alert
# OUTSIDE polygon → pure citizen report, no alert
#
REPORTS = [
    # ── 7 reports INSIDE polygons ─────────────────────────────────────────
    # Format: (lng, lat, ...)
    # 1 — main lake center (polygon 23680)
    (
        -3.7526, 35.8122,
        PollutionType.ALGAL_BLOOM, TrustLevel.HIGH, 3.2,
        "Dense green algal bloom covers most of the lake surface. Vivid colour change visible from the shore.",
        # PHOTO HINT: Search "algae bloom lake morocco green cyanobacteria 2024"
        # or use: https://commons.wikimedia.org/wiki/File:Algal_blooms_lake_erie.jpg
        "algae_bloom_lake_main",
    ),
    # 2 — northern bay (polygon 21578)
    (
        -3.7991, 35.8793,
        PollutionType.FOAM, TrustLevel.HIGH, 4.1,
        "White chemical foam 25–30 cm deep accumulated along the northern shore. Strong detergent smell.",
        # PHOTO HINT: Search "industrial foam water surface white chemical lake"
        "foam_chemical_north_shore",
    ),
    # 3 — upper cove (polygon 21784)
    (
        -3.8030, 35.8631,
        PollutionType.DISCOLORATION, TrustLevel.HIGH, 2.8,
        "Water turned brownish-orange near the cove inlet. Likely iron/sediment runoff from upstream mining.",
        # PHOTO HINT: Search "brown orange discolored water river mine drainage"
        "discoloration_iron_runoff",
    ),
    # 4 — central zone (polygon 22667)
    (
        -3.7965, 35.8247,
        PollutionType.OIL_SLICK, TrustLevel.HIGH, 5.4,
        "Rainbow iridescent oil sheen spreading from pipe outlet on west bank. Area approx. 200 m².",
        # PHOTO HINT: Search "oil slick rainbow sheen water surface pipe"
        "oil_slick_pipe_outlet",
    ),
    # 5 — central-east (polygon 22438) — similar type to #1, simulates repeated event
    (
        -3.7792, 35.8328,
        PollutionType.ALGAL_BLOOM, TrustLevel.HIGH, 3.9,
        "Green-blue cyanobacteria crust forming along eastern shore. Toxic warning signs needed.",
        # PHOTO HINT: Search "cyanobacteria lake shore green crust toxic bloom"
        "algae_cyanobacteria_east_shore",
    ),
    # 6 — southern end (polygon 23296)
    (
        -3.8116, 35.7785,
        PollutionType.DEBRIS, TrustLevel.HIGH, 6.2,
        "Large floating mass of plastic bottles, bags and household waste after recent floods.",
        # PHOTO HINT: Search "plastic waste debris floating lake flood"
        "debris_plastic_south_flood",
    ),
    # 7 — northeast cove (polygon 21571) — low trust, same foam type as #2
    (
        -3.7763, 35.8672,
        PollutionType.FOAM, TrustLevel.LOW, 14.8,
        "Patchy white foam scattered across surface. Unclear if natural (wave action) or chemical.",
        # PHOTO HINT: Search "foam patches lake surface natural vs chemical"
        "foam_patches_uncertain",
    ),

    # ── 6 reports OUTSIDE polygons (pure reports, no alert) ──────────────
    # 8 — irrigation channel east of lake
    (
        -3.7198, 35.7601,
        PollutionType.DEBRIS, TrustLevel.HIGH, 8.5,
        "Trash dump along irrigation channel 2 km east of the lake. Mixed household and industrial waste.",
        # PHOTO HINT: Search "trash dump irrigation canal north africa"
        "debris_irrigation_channel_east",
    ),
    # 9 — drainage pipe north
    (
        -3.6898, 35.9003,
        PollutionType.OIL_SLICK, TrustLevel.LOW, 21.3,
        "Dark oily liquid seeping from drainage pipe outlet on north bank. Small patch ~2 m².",
        # PHOTO HINT: Search "oil drainage pipe outlet small spill water"
        "oil_small_pipe_north",
    ),
    # 10 — stream south
    (
        -3.7999, 35.7498,
        PollutionType.ALGAL_BLOOM, TrustLevel.LOW, 18.7,
        "Greenish slime on rocks near stream outlet feeding the lake. Early-stage algal growth.",
        # PHOTO HINT: Search "green algae slime rocks stream inlet"
        "algae_early_stream_south",
    ),
    # 11 — mine area east (no polygon there)
    (
        -3.6601, 35.8149,
        PollutionType.DISCOLORATION, TrustLevel.HIGH, 4.7,
        "Water turned dark red-brown near old mining site. Strong acidic chemical smell. Possible AMD.",
        # PHOTO HINT: Search "acid mine drainage red water pollution stream"
        "discoloration_mine_drainage_east",
    ),
    # 12 — remote northwest area
    (
        -3.8519, 35.8934,
        PollutionType.UNKNOWN, TrustLevel.LOW, 35.0,
        "Water unusually murky with brown tint and foul smell. Remote location, difficult access.",
        # PHOTO HINT: Search "turbid murky brown water lake remote"
        "unknown_murky_northwest",
    ),
    # 13 — road runoff south (similar to #4 oil, simulates recurring event type)
    (
        -3.7652, 35.7450,
        PollutionType.OIL_SLICK, TrustLevel.HIGH, 7.1,
        "Black oil runoff traces from road into drainage ditch leading to the lake after heavy rain.",
        # PHOTO HINT: Search "oil runoff road rain drainage ditch pollution"
        "oil_road_runoff_south",
    ),
]


async def seed() -> None:
    fusion = SpatialFusionService()

    async with AsyncSessionLocal() as session:

        # ── 1. Remove stale alerts and reports ────────────────────────────
        print("Clearing existing alerts and reports...")
        await session.execute(delete(Alert))
        await session.execute(delete(CitizenReport))
        await session.commit()

        # ── 2. Delete unwanted polygons ───────────────────────────────────
        print(f"Keeping polygons: {KEEP_POLYGON_IDS}")
        deleted = await session.execute(
            delete(AnomalyPolygon).where(
                AnomalyPolygon.id.notin_(KEEP_POLYGON_IDS)
            )
        )
        print(f"  Deleted {deleted.rowcount} excess polygons.")

        # ── 3. Refresh detected_at so fusion 48-hr window accepts them ────
        now = datetime.now(timezone.utc)
        await session.execute(
            update(AnomalyPolygon)
            .where(AnomalyPolygon.id.in_(KEEP_POLYGON_IDS))
            .values(detected_at=now)
        )
        await session.commit()

        # Verify kept polygons
        from sqlalchemy import select, func
        kept = await session.scalar(select(func.count(AnomalyPolygon.id)))
        print(f"  Kept {kept} anomaly polygon(s), detected_at = now.")

        # ── 4. Insert reports ─────────────────────────────────────────────
        print(f"\nInserting {len(REPORTS)} citizen reports...")
        saved_reports = []
        for lng, lat, p_type, trust, accuracy, desc, photo_hint in REPORTS:
            report = CitizenReport(
                user_id=None,
                location=from_shape(Point(lng, lat), srid=4326),
                gnss_accuracy_m=accuracy,
                description=desc,
                photo_url=None,  # to be filled later — see photo_hint
                pollution_type=p_type,
                trust_level=trust,
                ai_verdict=f"SEEDED | GNSS: ±{accuracy:.0f}m | type: {p_type.value}",
                submitted_at=now,
            )
            session.add(report)
            saved_reports.append((report, lng, lat, photo_hint))

        await session.commit()
        for report, *_ in saved_reports:
            await session.refresh(report)

        print(f"  Saved {len(saved_reports)} reports.")

        # ── 5. Spatial fusion → create alerts ────────────────────────────
        print("\nRunning spatial fusion...")
        alerts_created = 0
        for report, lat, lng, photo_hint in saved_reports:
            anomaly_ids = await fusion.find_intersecting_anomalies(session, lng, lat)
            if anomaly_ids:
                await fusion.create_alert_if_match(session, report.id, anomaly_ids)
                alerts_created += len(anomaly_ids)
                print(f"  ALERT  report #{report.id} ({report.pollution_type.value}) "
                      f"→ {len(anomaly_ids)} polygon(s)  [{photo_hint}]")
            else:
                print(f"  report #{report.id} ({report.pollution_type.value}) "
                      f"no polygon match  [{photo_hint}]")

        print(f"\nDone. Alerts created: {alerts_created}")

    # ── 6. Print photo checklist ──────────────────────────────────────────
    print("\n" + "=" * 60)
    print("PHOTO CHECKLIST — find these images online:")
    print("=" * 60)
    photo_hints = {
        "algae_bloom_lake_main":
            'Search: "algae bloom green lake cyanobacteria aerial"',
        "foam_chemical_north_shore":
            'Search: "white chemical foam water surface lake shore"',
        "discoloration_iron_runoff":
            'Search: "brown orange discolored water iron mine runoff"',
        "oil_slick_pipe_outlet":
            'Search: "rainbow oil slick water surface pipe"',
        "algae_cyanobacteria_east_shore":
            'Search: "cyanobacteria bloom lake shore toxic green"',
        "debris_plastic_south_flood":
            'Search: "plastic waste debris floating lake flood"',
        "foam_patches_uncertain":
            'Search: "foam patches lake water surface"',
        "debris_irrigation_channel_east":
            'Search: "trash dump irrigation canal waste"',
        "oil_small_pipe_north":
            'Search: "small oil spill drainage pipe water"',
        "algae_early_stream_south":
            'Search: "green algae slime rocks stream"',
        "discoloration_mine_drainage_east":
            'Search: "acid mine drainage red water pollution AMD"',
        "unknown_murky_northwest":
            'Search: "turbid murky brown water lake"',
        "oil_road_runoff_south":
            'Search: "oil road runoff rain ditch pollution"',
    }
    for key, hint in photo_hints.items():
        print(f"  [{key}]\n    {hint}\n")


if __name__ == "__main__":
    asyncio.run(seed())
