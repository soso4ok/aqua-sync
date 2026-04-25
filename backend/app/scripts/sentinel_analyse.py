"""
AquaSync — Sentinel Hub Water Quality Test Script
Uses Ulyssys Water Quality Viewer (UWQV) evalscript via CDSE Processing API.

Run:
    python main.py --region balaton --year 2023
"""

import os
import io
import argparse
import requests
import numpy as np
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# ── Evalscript (UWQV — Ulyssys Water Quality Viewer) ──────────────────────────
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
    input: [
      { bands: ['B02','B03','B04','B05','B06','B08','B11','SCL'] }
    ],
    output: [
      { id: 'default', bands: 3, sampleType: 'UINT8' },
      { id: 'chlorophyllIndex', bands: 1, sampleType: 'FLOAT32' },
      { id: 'sedimentIndex', bands: 1, sampleType: 'FLOAT32' }
    ]
  };
}

function isCloud(scl) { return scl === 8 || scl === 9 || scl === 10; }
function isWater(ndwi, ndvi) { return ndwi > 0.0 && ndvi < 0; }

function evaluatePixel(s) {
  const ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);

  if (isCloud(s.SCL) || !isWater(ndwi, ndvi)) {
    return {
      default: [180, 180, 180],
      chlorophyllIndex: [0],
      sedimentIndex: [0]
    };
  }

  const baseline = s.B04 + (s.B06 - s.B04) * ((705 - 665) / (740 - 665));
  const chlIndex = s.B05 - baseline;
  const tssIndex = s.B05;

  let r, g, b;
  if (chlIndex > PARAMS.chlMin) {
    const t = Math.min((chlIndex - PARAMS.chlMin) / (PARAMS.chlMax - PARAMS.chlMin), 1);
    r = Math.round(0 + t * 50);
    g = Math.round(100 + t * 155);
    b = Math.round(50 - t * 50);
  } else {
    r = 0; g = 100; b = 200;
  }

  return {
    default: [r, g, b],
    chlorophyllIndex: [chlIndex],
    sedimentIndex: [tssIndex]
  };
}
"""

# ── Test regions ───────────────────────────────────────────────────────────────
TEST_REGIONS = {
    "taihu_lake": {
        "bbox": [119.7301, 30.9196, 120.6844, 31.6613],
        "desc": "Озеро Тайху, Китай (приклад з CASSINI notebook)"
    },
    "balaton": {
        "bbox": [17.25, 46.72, 17.95, 47.05],
        "desc": "Озеро Балатон, Угорщина (близько до Словаччини)"
    },
    "neusiedl": {
        "bbox": [16.65, 47.72, 17.05, 47.95],
        "desc": "Озеро Нойзідль, Австрія/Угорщина"
    },
}


def get_access_token(client_id: str, client_secret: str) -> str:
    """Get OAuth2 access token from CDSE identity provider."""
    token_url = (
        "https://identity.dataspace.copernicus.eu"
        "/auth/realms/CDSE/protocol/openid-connect/token"
    )
    resp = requests.post(token_url, data={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_water_quality(
    access_token: str,
    bbox_coords: list,
    time_interval: tuple = ("2023-09-01", "2023-09-30"),
    width: int = 512,
    height: int = 512,
) -> dict:
    """
    Direct HTTP call to CDSE Processing API.
    Returns dict with numpy arrays: default, chlorophyllIndex, sedimentIndex.
    """
    process_url = "https://sh.dataspace.copernicus.eu/api/v1/process"

    request_body = {
        "input": {
            "bounds": {
                "bbox": bbox_coords,
                "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"}
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": f"{time_interval[0]}T00:00:00Z",
                        "to": f"{time_interval[1]}T23:59:59Z"
                    },
                    "mosaickingOrder": "leastCC"
                }
            }]
        },
        "output": {
            "width": width,
            "height": height,
            "responses": [
                {"identifier": "default", "format": {"type": "image/tiff"}},
                {"identifier": "chlorophyllIndex", "format": {"type": "image/tiff"}},
                {"identifier": "sedimentIndex", "format": {"type": "image/tiff"}},
            ]
        },
        "evalscript": UWQV_EVALSCRIPT,
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/tar",
    }

    print("   📡 POST to", process_url)
    resp = requests.post(process_url, json=request_body, headers=headers)

    if resp.status_code != 200:
        print(f"   ❌ HTTP {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()

    # Response is a TAR archive with multiple TIFFs
    import tarfile
    tar = tarfile.open(fileobj=io.BytesIO(resp.content))
    data = {}
    os.makedirs("./data", exist_ok=True)
    for member in tar.getmembers():
        f = tar.extractfile(member)
        if f:
            content = f.read()
            # Save to disk
            out_path = os.path.join("./data", member.name)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as fp:
                fp.write(content)
            # Load as numpy
            img = Image.open(io.BytesIO(content))
            data[member.name] = np.array(img)
            print(f"   📦 {member.name}: shape={data[member.name].shape}, dtype={data[member.name].dtype}")

    return data


def analyze_results(data: dict) -> dict:
    """Аналіз результатів."""
    chl = None
    sed = None
    rgb = None
    for key, arr in data.items():
        if "chlorophyll" in key.lower():
            chl = arr
        elif "sediment" in key.lower():
            sed = arr
        elif "default" in key.lower():
            rgb = arr

    if chl is None or sed is None:
        print("   ⚠️  Could not find chlorophyll/sediment outputs")
        return {"total_water_pixels": 0, "chlorophyll": {}, "sediment": {}}

    CHL_ANOMALY_THRESHOLD = 0.02
    SED_ANOMALY_THRESHOLD = 0.15

    chl_flat = chl[chl != 0].flatten().astype(np.float64)
    chl_flat = chl_flat[np.isfinite(chl_flat)]
    sed_flat = sed[sed != 0].flatten().astype(np.float64)
    sed_flat = sed_flat[np.isfinite(sed_flat)]

    results = {
        "total_water_pixels": int(len(chl_flat)),
        "chlorophyll": {
            "mean": float(np.nanmean(chl_flat)) if len(chl_flat) else 0,
            "max": float(np.nanmax(chl_flat)) if len(chl_flat) else 0,
            "anomaly_pixels": int(np.sum(chl_flat > CHL_ANOMALY_THRESHOLD)),
            "anomaly_percent": float(
                np.sum(chl_flat > CHL_ANOMALY_THRESHOLD) / len(chl_flat) * 100
            ) if len(chl_flat) else 0,
        },
        "sediment": {
            "mean": float(np.nanmean(sed_flat)) if len(sed_flat) else 0,
            "max": float(np.nanmax(sed_flat)) if len(sed_flat) else 0,
            "anomaly_pixels": int(np.sum(sed_flat > SED_ANOMALY_THRESHOLD)),
            "anomaly_percent": float(
                np.sum(sed_flat > SED_ANOMALY_THRESHOLD) / len(sed_flat) * 100
            ) if len(sed_flat) else 0,
        },
        "rgb": rgb,
        "chl_raw": chl,
        "sed_raw": sed,
    }
    return results


def generate_visualization(stats: dict, region_name: str, time_interval: tuple):
    """Generate a PNG visualization of the water quality data."""
    from PIL import Image, ImageDraw, ImageFont

    rgb = stats.get("rgb")
    chl_raw = stats.get("chl_raw")

    if rgb is None:
        print("   ⚠️  No RGB data for visualization")
        return

    h, w = rgb.shape[:2]
    canvas_w = w * 2 + 60
    canvas_h = h + 160

    canvas = Image.new("RGB", (canvas_w, canvas_h), color=(10, 36, 99))
    draw = ImageDraw.Draw(canvas)

    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
        font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except (OSError, IOError):
        font_title = ImageFont.load_default()
        font_label = font_title
        font_small = font_title

    # Header
    draw.text((20, 12), "AquaSync — Water Quality Analysis", fill=(244, 247, 246), font=font_title)
    draw.text((20, 42), f"{region_name}  |  {time_interval[0]} -> {time_interval[1]}", fill=(62, 146, 204), font=font_label)

    # Left: RGB Water Quality Map
    rgb_img = Image.fromarray(rgb)
    canvas.paste(rgb_img, (20, 80))
    draw.text((20, 82 + h), "Water Quality (Evalscript)", fill=(200, 200, 200), font=font_small)

    # Right: Chlorophyll Heatmap
    if chl_raw is not None:
        chl_f = chl_raw.astype(np.float64)
        chl_norm = np.clip(chl_f, -0.01, 0.05)
        chl_norm = ((chl_norm + 0.01) / 0.06 * 255).astype(np.uint8)
        heatmap = np.zeros((*chl_norm.shape, 3), dtype=np.uint8)
        heatmap[..., 0] = np.clip(chl_norm * 2, 0, 255)
        heatmap[..., 1] = np.clip(255 - chl_norm, 0, 255)
        heatmap[..., 2] = np.clip(255 - chl_norm * 3, 0, 255)
        mask = (chl_raw == 0)
        heatmap[mask] = [40, 40, 50]
        heat_img = Image.fromarray(heatmap)
        canvas.paste(heat_img, (w + 40, 80))
        draw.text((w + 40, 82 + h), "Chlorophyll Anomaly Heatmap", fill=(200, 200, 200), font=font_small)

    # Status
    chl_pct = stats["chlorophyll"]["anomaly_percent"]
    sed_pct = stats["sediment"]["anomaly_percent"]
    if chl_pct > 20 or sed_pct > 30:
        txt = "HIGH THREAT — Significant water contamination!"
        col = (255, 130, 92)
    elif chl_pct > 5 or sed_pct > 15:
        txt = "WARNING — Moderate pollution levels."
        col = (245, 158, 11)
    else:
        txt = "NORMAL — Water quality within acceptable range."
        col = (62, 146, 204)
    draw.text((20, canvas_h - 40), txt, fill=col, font=font_label)
    draw.text((20, canvas_h - 20), f"Algae: {chl_pct:.1f}%  |  Turbidity: {sed_pct:.1f}%", fill=(150, 150, 150), font=font_small)

    out_path = "./data/aquasync_water_quality_map.png"
    canvas.save(out_path, quality=95)
    print(f"   🖼️  Saved: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="AquaSync Sentinel Hub Test")
    parser.add_argument("--client_id", default=os.getenv("SH_CLIENT_ID"))
    parser.add_argument("--client_secret", default=os.getenv("SH_CLIENT_SECRET"))
    parser.add_argument("--region", default="balaton", choices=list(TEST_REGIONS.keys()))
    parser.add_argument("--year", default="2023")
    args = parser.parse_args()

    if not args.client_id or not args.client_secret:
        print("❌ Потрібні credentials!")
        print("   1. Зареєструйся на https://dataspace.copernicus.eu/")
        print("   2. Створи OAuth Client у Dashboard")
        print("   3. python main.py --client_id YOUR_ID --client_secret YOUR_SECRET")
        return

    region = TEST_REGIONS[args.region]
    time_interval = (f"{args.year}-06-01", f"{args.year}-09-30")

    print(f"\n🛰  AquaSync — Sentinel Hub Water Quality Test")
    print(f"📍 Регіон: {region['desc']}")
    print(f"📅 Період: {time_interval[0]} → {time_interval[1]}")
    print(f"🔑 Client ID: {args.client_id[:8]}...")
    print("─" * 50)

    print("🔐 Getting access token from CDSE...")
    try:
        token = get_access_token(args.client_id, args.client_secret)
        print(f"   ✅ Token received ({len(token)} chars)")
    except Exception as e:
        print(f"   ❌ Auth failed: {e}")
        return

    print("⏳ Запит до Sentinel Hub Processing API...")
    try:
        data = fetch_water_quality(
            access_token=token,
            bbox_coords=region["bbox"],
            time_interval=time_interval,
        )
    except Exception as e:
        print(f"❌ Помилка запиту: {e}")
        return

    print("✅ Дані отримано!")

    print("\n📊 Аналіз аномалій:")
    stats = analyze_results(data)
    if not stats.get("chlorophyll"):
        return

    print(f"   🌊 Водних пікселів: {stats['total_water_pixels']:,}")
    print(f"   🟢 Хлорофіл (algae): середнє={stats['chlorophyll']['mean']:.4f}, "
          f"аномалії={stats['chlorophyll']['anomaly_percent']:.1f}%")
    print(f"   🟤 Седимент (turbidity): середнє={stats['sediment']['mean']:.4f}, "
          f"аномалії={stats['sediment']['anomaly_percent']:.1f}%")

    chl_pct = stats['chlorophyll']['anomaly_percent']
    sed_pct = stats['sediment']['anomaly_percent']
    if chl_pct > 20 or sed_pct > 30:
        print(f"\n🔴 ВИСОКИЙ РІВЕНЬ ЗАГРОЗИ!")
    elif chl_pct > 5 or sed_pct > 15:
        print(f"\n🟡 ПОПЕРЕДЖЕННЯ: Помірне забруднення.")
    else:
        print(f"\n🟢 ЯКІСТЬ ВОДИ В НОРМІ.")

    print(f"\n🖼️  Генерація візуалізації...")
    generate_visualization(stats, region["desc"], time_interval)

    print(f"\n💾 Всі файли в ./data/")
    print("✅ Тест завершено!")


if __name__ == "__main__":
    main()