import pytest
from app.services.anti_fraud.gnss import GNSSValidator

validator = GNSSValidator()

REJECT_THRESHOLD = 50.0


def _would_reject(accuracy_m: float) -> bool:
    """Mirror the endpoint logic: accuracy > 50m → reject."""
    return accuracy_m > REJECT_THRESHOLD


def test_high_accuracy_accepted():
    assert not _would_reject(1.2)


def test_moderate_accuracy_accepted():
    assert not _would_reject(20.0)


def test_boundary_accepted():
    assert not _would_reject(50.0)


def test_just_over_boundary_rejected():
    assert _would_reject(50.1)


def test_wifi_only_rejected():
    assert _would_reject(100.0)


def test_cell_tower_rejected():
    assert _would_reject(500.0)


def test_gnss_penalty_not_affected():
    # Accuracy between 20-50m still gets penalty 0.4 (LOW trust) but is not rejected
    result = validator.validate_accuracy(35.0)
    assert result.trust_penalty == 0.4
    assert not _would_reject(35.0)


def test_gnss_high_accuracy_no_penalty():
    result = validator.validate_accuracy(3.5)
    assert result.trust_penalty == 0.0
    assert not _would_reject(3.5)
