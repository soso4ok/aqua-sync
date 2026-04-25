from datetime import datetime

from app.services.sentinel.auth import SentinelHubAuth


class SentinelCatalog:
    """STAC catalog queries — find scenes by bbox/date/cloud coverage before processing."""

    def __init__(self, auth: SentinelHubAuth):
        self._auth = auth

    async def search_scenes(
        self,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        max_cloud_pct: float = 20.0,
    ) -> list[dict]:
        """Returns list of STAC feature dicts."""
        raise NotImplementedError
