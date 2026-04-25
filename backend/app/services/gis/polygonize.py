import numpy as np


class AnomalyPolygonizer:
    """Converts binary raster mask to GeoJSON polygons via gdal_polygonize."""

    def polygonize(
        self,
        mask: np.ndarray,
        profile: dict,
    ) -> list[dict]:
        """Returns list of GeoJSON Feature dicts with Polygon geometry (SRID 4326)."""
        raise NotImplementedError

    def _mask_to_tempfile(self, mask: np.ndarray, profile: dict) -> str:
        """Writes mask to a temporary GeoTIFF and returns its path."""
        raise NotImplementedError
