from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger


class AquaSyncScheduler:
    """APScheduler wrapper — registers daily satellite ingestion job at 06:00."""

    SATELLITE_INGEST_CRON = {"hour": 6, "minute": 0}

    def __init__(self):
        self._scheduler = AsyncIOScheduler()

    def start(self) -> None:
        self._register_jobs()
        self._scheduler.start()

    def shutdown(self) -> None:
        self._scheduler.shutdown(wait=False)

    def _register_jobs(self) -> None:
        # Satellite ingestion job — wired up once SatellitePipelineTask is implemented
        pass
