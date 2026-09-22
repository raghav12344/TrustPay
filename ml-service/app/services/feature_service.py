from statistics import mean, stdev


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

    transactions_last_1h = 0
    transactions_last_24h = 0
    transactions_last_7d = 0

    amount_last_24h = 0.0
    amount_last_7d = 0.0

    for transaction in previous_transactions:

        transaction_time = (
            transaction["transaction_time"]
        )

        time_difference = (
            current_time - transaction_time
        ).total_seconds()

        # Ignore future records just in case.
        if time_difference < 0:
            continue

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

    # IMPORTANT:
    #
    # For a brand-new customer there is no history.
    # Therefore the first device is NOT considered a
    # "new device" anomaly.
    #
    # We only call it a new device when the customer
    # actually has previous transactions.

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

    # Same idea as device:
    #
    # On the first transaction there is no previous
    # location to compare against.
    #
    # Therefore the first location is NOT considered
    # a location-change anomaly.

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
    # Unusual amount
    # ---------------------------------------------------------

    # We cannot determine whether an amount is unusual
    # without customer history.

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

    historical_hours = [
        transaction["transaction_time"].hour
        for transaction in previous_transactions
    ]

    # No history = no behavioral time comparison.
    #
    # With fewer than 3 transactions we also avoid making
    # a strong conclusion about the customer's normal time.

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

        "is_unusual_amount": (
            is_unusual_amount
        ),

        "is_unusual_time": (
            is_unusual_time
        ),
    }