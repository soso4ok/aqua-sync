from app.services.gis.polygonize import AnomalyPolygonizer
from app.services.gis.raster import RasterProcessor
from app.services.sentinel.auth import SentinelHubAuth
from app.services.sentinel.catalog import SentinelCatalog
from app.services.sentinel.processing import SentinelProcessing, WATER_QUALITY_EVALSCRIPT


class SatellitePipelineTask:
    """
    Daily satellite pipeline:
    Sentinel Hub → GeoTIFF → NDWI threshold → polygonize → PostGIS anomaly_polygons.
    """

    DEFAULT_BBOX = [22.0, 49.5, 26.0, 51.5]

    def __init__(self):
        self._auth = SentinelHubAuth()
        self._catalog = SentinelCatalog(self._auth)
        self._processing = SentinelProcessing(self._auth)
        self._raster = RasterProcessor()
        self._polygonizer = AnomalyPolygonizer()

    async def run(self, bbox: list[float] | None = None) -> int:
        """Runs full pipeline, returns number of anomaly polygons saved."""
        raise NotImplementedError

    async def _save_polygons(self, features: list[dict], stats: dict) -> int:
        raise NotImplementedError
