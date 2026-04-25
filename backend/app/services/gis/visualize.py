import io

import numpy as np
from PIL import Image, ImageDraw, ImageFont

_FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def _load_fonts() -> tuple:
    try:
        return (
            ImageFont.truetype(_FONT_BOLD, 22),
            ImageFont.truetype(_FONT_REG,  15),
            ImageFont.truetype(_FONT_REG,  12),
        )
    except (OSError, IOError):
        f = ImageFont.load_default()
        return f, f, f


class WaterQualityVisualizer:
    """Renders side-by-side RGB + chlorophyll heatmap PNG from UWQV stats."""

    def render(
        self,
        stats: dict,
        region_name: str,
        time_from: str,
        time_to: str,
    ) -> bytes:
        """Returns PNG image as bytes."""
        rgb     = stats.get("rgb")
        chl_raw = stats.get("chl_raw")
        chl     = stats.get("chlorophyll", {})
        sed     = stats.get("sediment", {})

        if rgb is None:
            raise ValueError("No RGB data in stats")

        h, w = rgb.shape[:2]
        canvas = Image.new("RGB", (w * 2 + 60, h + 160), color=(10, 36, 99))
        draw   = ImageDraw.Draw(canvas)
        font_title, font_label, font_small = _load_fonts()

        draw.text((20, 12), "AquaSync — Water Quality Analysis", fill=(244, 247, 246), font=font_title)
        draw.text((20, 42), f"{region_name}  |  {time_from} → {time_to}", fill=(62, 146, 204), font=font_label)

        canvas.paste(Image.fromarray(rgb), (20, 80))
        draw.text((20, 82 + h), "Water Quality (UWQV)", fill=(200, 200, 200), font=font_small)

        if chl_raw is not None:
            heatmap = self._chlorophyll_heatmap(chl_raw)
            canvas.paste(Image.fromarray(heatmap), (w + 40, 80))
            draw.text((w + 40, 82 + h), "Chlorophyll Anomaly Heatmap", fill=(200, 200, 200), font=font_small)

        chl_pct = chl.get("anomaly_percent", 0)
        sed_pct = sed.get("anomaly_percent", 0)
        txt, col = self._threat_label(chl_pct, sed_pct)
        draw.text((20, h + 120), txt, fill=col, font=font_label)
        draw.text((20, h + 142), f"Algae: {chl_pct:.1f}%  |  Turbidity: {sed_pct:.1f}%", fill=(150, 150, 150), font=font_small)

        buf = io.BytesIO()
        canvas.save(buf, format="PNG")
        return buf.getvalue()

    def _chlorophyll_heatmap(self, chl_raw: np.ndarray) -> np.ndarray:
        chl_f    = chl_raw.astype(np.float64)
        chl_norm = np.clip(chl_f, -0.01, 0.05)
        chl_norm = ((chl_norm + 0.01) / 0.06 * 255).astype(np.uint8)
        heatmap  = np.zeros((*chl_norm.shape, 3), dtype=np.uint8)
        heatmap[..., 0] = np.clip(chl_norm * 2,       0, 255)
        heatmap[..., 1] = np.clip(255 - chl_norm,     0, 255)
        heatmap[..., 2] = np.clip(255 - chl_norm * 3, 0, 255)
        heatmap[chl_raw == 0] = [40, 40, 50]
        return heatmap

    @staticmethod
    def _threat_label(chl_pct: float, sed_pct: float) -> tuple[str, tuple]:
        if chl_pct > 20 or sed_pct > 30:
            return "HIGH THREAT — Significant water contamination!", (255, 130, 92)
        if chl_pct > 5 or sed_pct > 15:
            return "WARNING — Moderate pollution levels.", (245, 158, 11)
        return "NORMAL — Water quality within acceptable range.", (62, 146, 204)
