import numpy as np


class RasterProcessor:
    """Reads GeoTIFF, applies NDWI threshold, returns binary anomaly mask."""

    NDWI_THRESHOLD = 0.42

    def load_geotiff(self, data: bytes) -> tuple[np.ndarray, dict]:
        """Returns (array, rasterio profile)."""
        raise NotImplementedError

    def apply_ndwi_threshold(self, ndwi_band: np.ndarray) -> np.ndarray:
        """Returns boolean mask where NDWI > threshold."""
        raise NotImplementedError

    def extract_water_quality_bands(self, array: np.ndarray) -> dict[str, np.ndarray]:
        """Returns dict with keys: ndwi, chlorophyll_a, cyanobacteria, turbidity."""
        raise NotImplementedError
