from datetime import datetime

from app.services.sentinel.auth import SentinelHubAuth


NDWI_EVALSCRIPT = """
//VERSION=3
function setup() {
  return { input: ["B03","B08"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  let ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  return [ndwi];
}
"""

WATER_QUALITY_EVALSCRIPT = """
//VERSION=3
function setup() {
  return { input: ["B01","B02","B03","B04","B05","B06","B07","B08"], output: { bands: 6, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  let ndwi   = (s.B03 - s.B08) / (s.B03 + s.B08);
  let chl    = 4.26 * Math.pow(s.B03 / s.B01, 3.94);
  let cyan   = 115530.31 * Math.pow((s.B03 * s.B04) / s.B02, 2.38);
  let turb   = 8.93 * (s.B03 / s.B01) - 6.39;
  return [ndwi, chl, cyan, turb, s.B03, s.B08];
}
"""


class SentinelProcessing:
    """Sends evalscript requests to Sentinel Hub Processing API, returns GeoTIFF bytes."""

    def __init__(self, auth: SentinelHubAuth):
        self._auth = auth

    async def fetch_geotiff(
        self,
        evalscript: str,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        resolution_m: int = 10,
    ) -> bytes:
        raise NotImplementedError

    def _build_request_payload(
        self,
        evalscript: str,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        resolution_m: int,
    ) -> dict:
        raise NotImplementedError
