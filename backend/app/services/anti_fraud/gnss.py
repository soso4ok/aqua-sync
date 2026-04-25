from datetime import datetime


class GNSSValidator:
    """Validates GNSS accuracy and detects coordinate spoofing."""

    MAX_ACCURACY_METERS = 5.0
    MAX_TIMESTAMP_DRIFT_SECONDS = 300

    def validate_accuracy(self, gnss_accuracy_m: float | None) -> tuple[bool, str]:
        """Returns (is_valid, reason)."""
        raise NotImplementedError

    def validate_timestamp(
        self,
        captured_at: datetime,
        server_received_at: datetime,
    ) -> tuple[bool, str]:
        raise NotImplementedError

    def validate_shadow_angle(
        self,
        image_bytes: bytes,
        latitude: float,
        longitude: float,
        captured_at: datetime,
    ) -> tuple[bool, str]:
        """Cross-references shadow direction in photo with expected solar azimuth."""
        raise NotImplementedError
