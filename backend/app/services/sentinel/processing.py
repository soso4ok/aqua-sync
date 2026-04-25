import io
import tarfile
from datetime import datetime

import httpx

from app.services.sentinel.auth import SentinelHubAuth

# Simple single-band NDWI — used for binary water mask
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

# UWQV (Ulyssys Water Quality Viewer) — cloud-filtered, multi-output
# Returns TAR with: default (RGB UINT8), chlorophyllIndex (FLOAT32), sedimentIndex (FLOAT32)
UWQV_EVALSCRIPT = """
//VERSION=3
const PARAMS = {
  chlMin: -0.005,
  chlMax: 0.05,
  tssMin: 0.075,
  tssMax: 0.185,
};

function setup() {
  return {
    input: [{ bands: ['B02','B03','B04','B05','B06','B08','B11','SCL'] }],
    output: [
      { id: 'default',          bands: 3, sampleType: 'UINT8'   },
      { id: 'chlorophyllIndex', bands: 1, sampleType: 'FLOAT32' },
      { id: 'sedimentIndex',    bands: 1, sampleType: 'FLOAT32' }
    ]
  };
}

function isCloud(scl) { return scl === 8 || scl === 9 || scl === 10; }
function isWater(ndwi, ndvi) { return ndwi > 0.0 && ndvi < 0; }

function evaluatePixel(s) {
  const ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);

  if (isCloud(s.SCL) || !isWater(ndwi, ndvi)) {
    return { default: [180,180,180], chlorophyllIndex: [0], sedimentIndex: [0] };
  }

  const baseline = s.B04 + (s.B06 - s.B04) * ((705 - 665) / (740 - 665));
  const chlIndex = s.B05 - baseline;
  const tssIndex = s.B05;

  let r, g, b;
  if (chlIndex > PARAMS.chlMin) {
    const t = Math.min((chlIndex - PARAMS.chlMin) / (PARAMS.chlMax - PARAMS.chlMin), 1);
    r = Math.round(0  + t * 50);
    g = Math.round(100 + t * 155);
    b = Math.round(50  - t * 50);
  } else {
    r = 0; g = 100; b = 200;
  }

  return { default: [r,g,b], chlorophyllIndex: [chlIndex], sedimentIndex: [tssIndex] };
}
"""

# Kept for reference — Se2WaQ formula-based single-request approach
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

# Processing API URL (confirmed from CDSE docs)
_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"


class SentinelProcessing:
    """Sends evalscript requests to Sentinel Hub Processing API."""

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
        """Single-output evalscript — returns raw GeoTIFF bytes."""
        token = await self._auth.get_token()
        payload = self._build_request_payload(evalscript, bbox, date_from, date_to, resolution_m)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                _PROCESS_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "image/tiff",
                },
            )
            resp.raise_for_status()
            return resp.content

    async def fetch_uwqv(
        self,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        width: int = 512,
        height: int = 512,
    ) -> dict[str, bytes]:
        """
        UWQV multi-output request — API returns a TAR archive.
        Returns dict keyed by output name: 'default', 'chlorophyllIndex', 'sedimentIndex'.
        """
        token = await self._auth.get_token()
        payload = self._build_uwqv_payload(bbox, date_from, date_to, width, height)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                _PROCESS_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "application/tar",
                },
            )
            resp.raise_for_status()
            return self._unpack_tar(resp.content)

    def _unpack_tar(self, content: bytes) -> dict[str, bytes]:
        """Extracts TIFF files from TAR response, keyed by member name."""
        result: dict[str, bytes] = {}
        with tarfile.open(fileobj=io.BytesIO(content)) as tar:
            for member in tar.getmembers():
                f = tar.extractfile(member)
                if f:
                    result[member.name] = f.read()
        return result

    def _build_request_payload(
        self,
        evalscript: str,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        resolution_m: int,
    ) -> dict:
        return {
            "input": {
                "bounds": {
                    "bbox": bbox,
                    "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": date_from.strftime("%Y-%m-%dT00:00:00Z"),
                            "to": date_to.strftime("%Y-%m-%dT23:59:59Z"),
                        },
                        "mosaickingOrder": "leastCC",
                    },
                }],
            },
            "output": {
                "resx": resolution_m / 111320,
                "resy": resolution_m / 111320,
                "responses": [{"identifier": "default", "format": {"type": "image/tiff"}}],
            },
            "evalscript": evalscript,
        }

    def _build_uwqv_payload(
        self,
        bbox: list[float],
        date_from: datetime,
        date_to: datetime,
        width: int,
        height: int,
    ) -> dict:
        return {
            "input": {
                "bounds": {
                    "bbox": bbox,
                    "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": date_from.strftime("%Y-%m-%dT00:00:00Z"),
                            "to": date_to.strftime("%Y-%m-%dT23:59:59Z"),
                        },
                        "mosaickingOrder": "leastCC",
                    },
                }],
            },
            "output": {
                "width": width,
                "height": height,
                "responses": [
                    {"identifier": "default",          "format": {"type": "image/tiff"}},
                    {"identifier": "chlorophyllIndex",  "format": {"type": "image/tiff"}},
                    {"identifier": "sedimentIndex",     "format": {"type": "image/tiff"}},
                ],
            },
            "evalscript": UWQV_EVALSCRIPT,
        }
