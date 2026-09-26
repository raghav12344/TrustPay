import math
from statistics import mean, stdev
from datetime import timezone


def haversine_distance_km(lat1, lon1, lat2, lon2) -> float:
    """
    Calculate great-circle distance between two geographic coordinates in kilometers.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0
    try:
        phi1 = math.radians(float(lat1))
        phi2 = math.radians(float(lat2))
        delta_phi = math.radians(float(lat2) - float(lat1))
        delta_lambda = math.radians(float(lon2) - float(lon1))
        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
        return round(6371.0 * c, 2)
    except (ValueError, TypeError):
        return 0.0



def build_customer_features(
    current_transaction: dict,
    previous_transactions: list[dict],
):
    current_amount = float(
        current_transaction["amount"]
    )

    current_time = current_transaction[
        "transaction_time"
    ]

    # ---------------------------------------------------------
    # Normalize current transaction time
    # ---------------------------------------------------------

    if current_time.tzinfo is not None:
        current_time = current_time.astimezone(
            timezone.utc
        ).replace(tzinfo=None)

    current_hour = current_time.hour
    current_weekday = current_time.weekday()

    # ---------------------------------------------------------
    # Customer history
    # ---------------------------------------------------------

    transaction_count = len(
        previous_transactions
    )

    # ---------------------------------------------------------
    # Time features
    # ---------------------------------------------------------

    is_night = int(
        current_hour >= 22
        or current_hour < 6
    )

    is_weekend = int(
        current_weekday >= 5
    )

    # ---------------------------------------------------------
    # Historical amount features
    # ---------------------------------------------------------

    historical_amounts = [
        float(transaction["amount"])
        for transaction in previous_transactions
    ]

    if historical_amounts:

        historical_amount_mean = mean(
            historical_amounts
        )

        historical_amount_min = min(
            historical_amounts
        )

        historical_amount_max = max(
            historical_amounts
        )

        if len(historical_amounts) >= 2:
            historical_amount_std = stdev(
                historical_amounts
            )
        else:
            historical_amount_std = 0.0

    else:

        historical_amount_mean = 0.0
        historical_amount_std = 0.0
        historical_amount_min = 0.0
        historical_amount_max = 0.0

    # ---------------------------------------------------------
    # Amount comparison
    # ---------------------------------------------------------

    if historical_amount_mean > 0:

        amount_to_historical_mean = (
            current_amount
            / historical_amount_mean
        )

    else:

        amount_to_historical_mean = 0.0

    if historical_amount_std > 0:

        amount_zscore = (
            (
                current_amount
                - historical_amount_mean
            )
            / historical_amount_std
        )

    else:

        amount_zscore = 0.0

    # ---------------------------------------------------------
    # Recent transaction activity
    # ---------------------------------------------------------

    transactions_last_10m = 0
    amount_last_10m = 0.0
    transactions_last_1h = 0
    transactions_last_24h = 0
    transactions_last_7d = 0

    amount_last_24h = 0.0
    amount_last_7d = 0.0

    for transaction in previous_transactions:

        transaction_time = (
            transaction["transaction_time"]
        )

        # Normalize historical MySQL timestamp
        # to naive UTC for safe subtraction.
        if transaction_time.tzinfo is not None:
            transaction_time = (
                transaction_time
                .astimezone(timezone.utc)
                .replace(tzinfo=None)
            )

        time_difference = (
            current_time - transaction_time
        ).total_seconds()

        # Ignore future records just in case.
        if time_difference < 0:
            continue

        if time_difference <= 600:
            transactions_last_10m += 1
            amount_last_10m += float(
                transaction["amount"]
            )

        if time_difference <= 3600:
            transactions_last_1h += 1

        if time_difference <= 86400:

            transactions_last_24h += 1

            amount_last_24h += float(
                transaction["amount"]
            )

        if time_difference <= 604800:

            transactions_last_7d += 1

            amount_last_7d += float(
                transaction["amount"]
            )

    is_burst_velocity = int(transactions_last_10m >= 3)

    # ---------------------------------------------------------
    # Device behavior
    # ---------------------------------------------------------

    previous_devices = {
        transaction["device_id"]
        for transaction in previous_transactions
        if transaction["device_id"] is not None
    }

    current_device_id = (
        current_transaction.get("device_id")
    )

    if transaction_count == 0:

        known_device = 0
        new_device = 0

    else:

        known_device = int(
            current_device_id is not None
            and current_device_id in previous_devices
        )

        new_device = int(
            current_device_id is not None
            and current_device_id not in previous_devices
        )

    # ---------------------------------------------------------
    # Location behavior
    # ---------------------------------------------------------

    previous_locations = {
        transaction["location_id"]
        for transaction in previous_transactions
        if transaction["location_id"] is not None
    }

    current_location_id = (
        current_transaction.get("location_id")
    )

    if transaction_count == 0:

        known_location = 0
        location_changed = 0

    else:

        known_location = int(
            current_location_id is not None
            and current_location_id in previous_locations
        )

        location_changed = int(
            current_location_id is not None
            and current_location_id not in previous_locations
        )

    # ---------------------------------------------------------
    # Spatial Velocity & Impossible Travel Telemetry
    # ---------------------------------------------------------

    current_lat = current_transaction.get("latitude")
    current_lon = current_transaction.get("longitude")

    distance_from_last_km = 0.0
    travel_speed_kmh = 0.0
    is_impossible_travel = 0
    min_distance_to_known_locations_km = 0.0
    is_distant_location = 0

    if current_lat is not None and current_lon is not None and transaction_count > 0:
        c_lat = float(current_lat)
        c_lon = float(current_lon)

        # 1. Evaluate distance and speed relative to the most recent transaction with coordinates
        for prev in reversed(previous_transactions):
            p_lat = prev.get("latitude")
            p_lon = prev.get("longitude")
            if p_lat is not None and p_lon is not None:
                p_time = prev["transaction_time"]
                if p_time.tzinfo is not None:
                    p_time = (
                        p_time.astimezone(timezone.utc).replace(tzinfo=None)
                    )

                delta_sec = max(1.0, (current_time - p_time).total_seconds())
                dist = haversine_distance_km(c_lat, c_lon, float(p_lat), float(p_lon))
                distance_from_last_km = dist

                hours = delta_sec / 3600.0
                speed = dist / hours if hours > 0 else 0.0
                travel_speed_kmh = round(speed, 2)

                # Impossible travel: implied speed exceeds 800 km/h over > 100 km
                if speed > 800.0 and dist > 100.0:
                    is_impossible_travel = 1
                break

        # 2. Minimum distance to any previously visited location
        known_locations_coords = [
            (float(p["latitude"]), float(p["longitude"]))
            for p in previous_transactions
            if p.get("latitude") is not None and p.get("longitude") is not None
        ]
        if known_locations_coords:
            all_dists = [
                haversine_distance_km(c_lat, c_lon, k_lat, k_lon)
                for k_lat, k_lon in known_locations_coords
            ]
            min_distance_to_known_locations_km = round(min(all_dists), 2)
            if min_distance_to_known_locations_km > 500.0 and transaction_count >= 3:
                is_distant_location = 1

    # ---------------------------------------------------------
    # Balance Depletion (Capital Drain) Telemetry
    # ---------------------------------------------------------

    account_balance = current_transaction.get("balance")
    if account_balance is not None and float(account_balance) > 0:
        bal = float(account_balance)
        balance_drain_ratio = round(min(1.0, current_amount / bal), 4)
        is_high_balance_drain = int(
            balance_drain_ratio >= 0.85
            and current_amount >= 1000.0
            and (new_device or location_changed)
        )
    else:
        balance_drain_ratio = 0.0
        is_high_balance_drain = 0

    # ---------------------------------------------------------
    # Extreme Outlier Telemetry
    # ---------------------------------------------------------

    is_extreme_outlier = int(
        (amount_zscore >= 3.5 and transaction_count >= 3)
        or (amount_to_historical_mean >= 5.0 and historical_amount_mean >= 100.0)
    )

    # ---------------------------------------------------------
    # Unusual amount
    # ---------------------------------------------------------

    if transaction_count == 0:

        is_unusual_amount = 0

    else:

        is_unusual_amount = int(
            historical_amount_mean > 0
            and current_amount
            > historical_amount_mean * 3
        )

    # ---------------------------------------------------------
    # Unusual time
    # ---------------------------------------------------------

    historical_hours = []

    for transaction in previous_transactions:

        historical_time = (
            transaction["transaction_time"]
        )

        if historical_time.tzinfo is not None:
            historical_time = (
                historical_time
                .astimezone(timezone.utc)
                .replace(tzinfo=None)
            )

        historical_hours.append(
            historical_time.hour
        )

    if len(historical_hours) >= 3:

        min_hour = min(
            historical_hours
        )

        max_hour = max(
            historical_hours
        )

        is_unusual_time = int(
            current_hour < min_hour
            or current_hour > max_hour
        )

    else:

        is_unusual_time = 0

    # ---------------------------------------------------------
    # History confidence
    # ---------------------------------------------------------

    if transaction_count == 0:

        history_confidence = "NONE"

    elif transaction_count < 3:

        history_confidence = "LIMITED"

    elif transaction_count < 5:

        history_confidence = "MODERATE"

    else:

        history_confidence = "ESTABLISHED"

    # ---------------------------------------------------------
    # Return features
    # ---------------------------------------------------------

    return {
        "amount": current_amount,

        "transaction_hour": current_hour,

        "is_night": is_night,

        "is_weekend": is_weekend,

        "transaction_count": (
            transaction_count
        ),

        "history_confidence": (
            history_confidence
        ),

        "historical_amount_mean": (
            historical_amount_mean
        ),

        "historical_amount_std": (
            historical_amount_std
        ),

        "historical_amount_min": (
            historical_amount_min
        ),

        "historical_amount_max": (
            historical_amount_max
        ),

        "amount_to_historical_mean": (
            amount_to_historical_mean
        ),

        "amount_zscore": amount_zscore,

        "transactions_last_10m": (
            transactions_last_10m
        ),

        "amount_last_10m": (
            amount_last_10m
        ),

        "is_burst_velocity": (
            is_burst_velocity
        ),

        "transactions_last_1h": (
            transactions_last_1h
        ),

        "transactions_last_24h": (
            transactions_last_24h
        ),

        "transactions_last_7d": (
            transactions_last_7d
        ),

        "amount_last_24h": (
            amount_last_24h
        ),

        "amount_last_7d": (
            amount_last_7d
        ),

        "known_device": known_device,

        "new_device": new_device,

        "known_location": known_location,

        "location_changed": location_changed,

        "distance_from_last_km": (
            distance_from_last_km
        ),

        "travel_speed_kmh": (
            travel_speed_kmh
        ),

        "is_impossible_travel": (
            is_impossible_travel
        ),

        "min_distance_to_known_locations_km": (
            min_distance_to_known_locations_km
        ),

        "is_distant_location": (
            is_distant_location
        ),

        "balance_drain_ratio": (
            balance_drain_ratio
        ),

        "is_high_balance_drain": (
            is_high_balance_drain
        ),

        "is_extreme_outlier": (
            is_extreme_outlier
        ),

        "is_unusual_amount": (
            is_unusual_amount
        ),

        "is_unusual_time": (
            is_unusual_time
        ),
    }