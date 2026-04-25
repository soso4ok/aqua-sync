from datetime import datetime, timezone
from dataclasses import dataclass

HIGH_ACCURACY_THRESHOLD_M = 5.0
MAX_TIMESTAMP_DRIFT_SECONDS = 300


@dataclass
class GNSSValidationResult:
    passed: bool
    trust_penalty: float  # 0.0 = no penalty, 1.0 = full penalty (Evidence Void)
    reason: str


class GNSSValidator:
    """
    Soft GNSS validation — never hard-rejects on accuracy alone.
    Low accuracy (>5m) lowers trust score instead of blocking the report,
    because poor accuracy may mean old hardware, not fraud.
    """

    def validate_accuracy(self, gnss_accuracy_m: float | None) -> GNSSValidationResult:
        if gnss_accuracy_m is None:
            return GNSSValidationResult(passed=True, trust_penalty=0.3, reason="No accuracy data")
        if gnss_accuracy_m < HIGH_ACCURACY_THRESHOLD_M:
            return GNSSValidationResult(passed=True, trust_penalty=0.0, reason="High accuracy")
        if gnss_accuracy_m < 20.0:
            return GNSSValidationResult(
                passed=True,
                trust_penalty=0.2,
                reason=f"Moderate accuracy ({gnss_accuracy_m:.1f}m)",
            )
        return GNSSValidationResult(
            passed=True,
            trust_penalty=0.4,
            reason=f"Low accuracy ({gnss_accuracy_m:.1f}m) — possible old device",
        )

    def validate_timestamp(
        self,
        captured_at: datetime,
        server_received_at: datetime,
    ) -> GNSSValidationResult:
        drift = abs((server_received_at - captured_at).total_seconds())
        if drift <= MAX_TIMESTAMP_DRIFT_SECONDS:
            return GNSSValidationResult(passed=True, trust_penalty=0.0, reason="Timestamp valid")
        if drift <= 3600:
            return GNSSValidationResult(
                passed=True,
                trust_penalty=0.3,
                reason=f"Timestamp drift {drift:.0f}s",
            )
        # >1h drift is suspicious — could be replayed report
        return GNSSValidationResult(
            passed=False,
            trust_penalty=1.0,
            reason=f"Timestamp drift {drift:.0f}s — possible replay",
        )

    def validate_shadow_angle(
        self,
        image_bytes: bytes,
        latitude: float,
        longitude: float,
        captured_at: datetime,
    ) -> GNSSValidationResult:
        raise NotImplementedError

    def combined_trust_penalty(self, *results: GNSSValidationResult) -> float:
        """Combines penalties — capped at 1.0."""
        return min(sum(r.trust_penalty for r in results), 1.0)
