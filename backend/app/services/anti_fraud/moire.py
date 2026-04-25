import numpy as np


class MoireDetector:
    """Detects re-photographed screens via FFT frequency analysis + Laplacian sharpness."""

    FFT_PEAK_THRESHOLD = 0.15
    LAPLACIAN_BLUR_THRESHOLD = 100.0

    def is_screen_photo(self, image_bytes: bytes) -> tuple[bool, str]:
        """Returns (is_fraud, reason). True means the photo is a re-photograph of a screen."""
        raise NotImplementedError

    def _compute_fft_score(self, gray: np.ndarray) -> float:
        """Returns normalized energy ratio at periodic frequencies typical of display grids."""
        raise NotImplementedError

    def _compute_laplacian_variance(self, gray: np.ndarray) -> float:
        raise NotImplementedError
