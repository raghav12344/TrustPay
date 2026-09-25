from datetime import datetime, timedelta

from app.services.feature_service import build_customer_features


def _tx(amount, hours_ago, device_id=1, location_id=1, base_time=None):
    base_time = base_time or datetime(2026, 1, 15, 12, 0, 0)
    return {
        "amount": amount,
        "transaction_time": base_time - timedelta(hours=hours_ago),
        "device_id": device_id,
        "location_id": location_id,
        "transaction_type": "PAYMENT",
        "status": "APPROVED",
    }


def test_cold_start_has_no_history_and_no_device_or_location_flags():
    current = {
        "amount": 500.0,
        "transaction_time": datetime(2026, 1, 15, 12, 0, 0),
        "device_id": 1,
        "location_id": 1,
    }

    features = build_customer_features(
        current_transaction=current,
        previous_transactions=[],
    )

    assert features["transaction_count"] == 0
    assert features["new_device"] == 0
    assert features["known_device"] == 0
    assert features["location_changed"] == 0
    assert features["known_location"] == 0
    assert features["is_unusual_amount"] == 0
    assert features["is_unusual_time"] == 0
    assert features["history_confidence"] == "NONE"


def test_known_device_and_location_are_recognized():
    base_time = datetime(2026, 1, 15, 12, 0, 0)
    previous = [
        _tx(400, hours_ago=48, device_id=1, location_id=1, base_time=base_time),
        _tx(420, hours_ago=24, device_id=1, location_id=1, base_time=base_time),
    ]
    current = {
        "amount": 410.0,
        "transaction_time": base_time,
        "device_id": 1,
        "location_id": 1,
    }

    features = build_customer_features(
        current_transaction=current,
        previous_transactions=previous,
    )

    assert features["known_device"] == 1
    assert features["new_device"] == 0
    assert features["known_location"] == 1
    assert features["location_changed"] == 0


def test_new_device_and_new_location_are_flagged_for_established_customer():
    base_time = datetime(2026, 1, 15, 12, 0, 0)
    previous = [
        _tx(400, hours_ago=48, device_id=1, location_id=1, base_time=base_time),
        _tx(420, hours_ago=24, device_id=1, location_id=1, base_time=base_time),
    ]
    current = {
        "amount": 410.0,
        "transaction_time": base_time,
        "device_id": 99,
        "location_id": 99,
    }

    features = build_customer_features(
        current_transaction=current,
        previous_transactions=previous,
    )

    assert features["new_device"] == 1
    assert features["known_device"] == 0
    assert features["location_changed"] == 1
    assert features["known_location"] == 0


def test_unusual_amount_flags_when_far_above_historical_mean():
    base_time = datetime(2026, 1, 15, 12, 0, 0)
    previous = [
        _tx(100, hours_ago=72, base_time=base_time),
        _tx(120, hours_ago=48, base_time=base_time),
        _tx(110, hours_ago=24, base_time=base_time),
    ]
    current = {
        "amount": 5000.0,
        "transaction_time": base_time,
        "device_id": 1,
        "location_id": 1,
    }

    features = build_customer_features(
        current_transaction=current,
        previous_transactions=previous,
    )

    assert features["is_unusual_amount"] == 1


def test_unusual_time_requires_at_least_three_prior_transactions():
    base_time = datetime(2026, 1, 15, 3, 0, 0)  # 3 AM
    # Only 2 prior transactions -> not enough history to judge "unusual".
    previous = [
        _tx(100, hours_ago=48, base_time=base_time),
        _tx(100, hours_ago=24, base_time=base_time),
    ]
    current = {
        "amount": 100.0,
        "transaction_time": base_time,
        "device_id": 1,
        "location_id": 1,
    }

    features = build_customer_features(
        current_transaction=current,
        previous_transactions=previous,
    )

    assert features["is_unusual_time"] == 0
