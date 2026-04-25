import io

import numpy as np
import rasterio
from PIL import Image


class RasterProcessor:
    """Reads GeoTIFF, applies NDWI threshold, returns binary anomaly mask."""

    NDWI_THRESHOLD = 0.42
    CHL_ANOMALY_THRESHOLD = 0.02
    SED_ANOMALY_THRESHOLD = 0.15

    def load_geotiff(self, data: bytes) -> tuple[np.ndarray, dict]:
        """Returns (array shape [bands, H, W], rasterio profile)."""
        with rasterio.open(io.BytesIO(data)) as src:
            return src.read(), src.profile

    def apply_ndwi_threshold(self, ndwi_band: np.ndarray) -> np.ndarray:
        """Returns boolean mask where NDWI > threshold."""
        return ndwi_band > self.NDWI_THRESHOLD

    def extract_water_quality_bands(self, array: np.ndarray) -> dict[str, np.ndarray]:
        """
        Parses WATER_QUALITY_EVALSCRIPT 6-band output.
        Band order: [ndwi, chlorophyll_a, cyanobacteria, turbidity, B03, B08]
        """
        return {
            "ndwi":          array[0],
            "chlorophyll_a": array[1],
            "cyanobacteria": array[2],
            "turbidity":     array[3],
        }

    def load_uwqv_tiffs(self, tar_files: dict[str, bytes]) -> dict[str, np.ndarray]:
        """
        Converts TAR-extracted TIFF bytes from UWQV response to numpy arrays.
        Keys: 'default' (RGB uint8), 'chlorophyllIndex' (float32), 'sedimentIndex' (float32).
        """
        result: dict[str, np.ndarray] = {}
        for name, content in tar_files.items():
            key = next(
                (k for k in ("chlorophyllIndex", "sedimentIndex", "default") if k in name),
                name,
            )
            result[key] = np.array(Image.open(io.BytesIO(content)))
        return result

    def analyze_water_quality(self, arrays: dict[str, np.ndarray]) -> dict:
        """
        Computes per-pixel anomaly statistics from UWQV outputs.
        Returns stats dict with chlorophyll + sediment metrics.
        """
        chl = arrays.get("chlorophyllIndex")
        sed = arrays.get("sedimentIndex")
        rgb = arrays.get("default")

        if chl is None or sed is None:
            return {"total_water_pixels": 0, "chlorophyll": {}, "sediment": {}, "rgb": rgb}

        chl_flat = chl[chl != 0].flatten().astype(np.float64)
        chl_flat = chl_flat[np.isfinite(chl_flat)]
        sed_flat = sed[sed != 0].flatten().astype(np.float64)
        sed_flat = sed_flat[np.isfinite(sed_flat)]

        def _stats(arr: np.ndarray, threshold: float) -> dict:
            if len(arr) == 0:
                return {"mean": 0.0, "max": 0.0, "anomaly_pixels": 0, "anomaly_percent": 0.0}
            return {
                "mean":            float(np.nanmean(arr)),
                "max":             float(np.nanmax(arr)),
                "anomaly_pixels":  int(np.sum(arr > threshold)),
                "anomaly_percent": float(np.sum(arr > threshold) / len(arr) * 100),
            }

        return {
            "total_water_pixels": int(len(chl_flat)),
            "chlorophyll":        _stats(chl_flat, self.CHL_ANOMALY_THRESHOLD),
            "sediment":           _stats(sed_flat, self.SED_ANOMALY_THRESHOLD),
            "rgb":                rgb,
            "chl_raw":            chl,
            "sed_raw":            sed,
        }
