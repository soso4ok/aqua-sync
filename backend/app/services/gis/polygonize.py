import numpy as np
from rasterio.features import shapes
from rasterio.transform import from_bounds
from shapely.geometry import mapping, shape


class AnomalyPolygonizer:
    """Converts binary raster mask to GeoJSON polygons using rasterio.features.shapes."""

    def polygonize(
        self,
        mask: np.ndarray,
        profile: dict,
    ) -> list[dict]:
        """
        Returns list of GeoJSON Feature dicts with Polygon geometry (SRID 4326).
        mask: boolean 2D numpy array (True = anomaly pixel).
        profile: rasterio profile with transform and crs.
        """
        binary = mask.astype(np.uint8)
        transform = profile.get("transform")
        features = []
        for geom, value in shapes(binary, transform=transform):
            if value == 1:
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": {},
                })
        return features
