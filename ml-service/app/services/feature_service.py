from datetime import datetime

import pandas as pd


def build_customer_features(
    current_transaction: dict,
    historical_transactions: list[dict],
) -> dict:
    """
    Build customer-centric features using only the customer's
    previous transactions.
    """

    current_amount = float(current_transaction["amount"])

    current_time = pd.to_datetime(
        current_transaction["transaction_time"]
    )

    current_device_id = current_transaction.get("device_id")
    current_location_id = current_transaction.get("location_id")

    # ---------------------------------------------------------
    # Customer has no previous transaction history
    # ---------------------------------------------------------

    if not historical_transactions:
        return {
            "amount": current_amount,
            "transaction_hour": current_time.hour,
            "is_night": int(
                current_time.hour < 6 or current_time.hour >= 22
            ),
            "is_weekend": int(current_time.weekday() >= 5),

            "transaction_count": 0,
            "historical_amount_mean": 0.0,
            "historical_amount_std": 0.0,
            "historical_amount_min": 0.0,
            "historical_amount_max": 0.0,

            "amount_to_historical_mean": 0.0,
            "amount_zscore": 0.0,

            "transactions_last_1h": 0,
            "transactions_last_24h": 0,
            "transactions_last_7d": 0,

            "amount_last_24h": 0.0,
            "amount_last_7d": 0.0,

            "new_device": 1,
            "location_changed": 1,

            "is_unusual_amount": 0,
            "is_unusual_time": 0,
        }

    # ---------------------------------------------------------
    # Convert history into DataFrame
    # ---------------------------------------------------------

    history = pd.DataFrame(historical_transactions)

    history["transaction_time"] = pd.to_datetime(
        history["transaction_time"]
    )

    history["amount"] = history["amount"].astype(float)

    # ---------------------------------------------------------
    # Historical amount statistics
    # ---------------------------------------------------------

    transaction_count = len(history)

    historical_mean = history["amount"].mean()
    historical_std = history["amount"].std()

    if pd.isna(historical_std):
        historical_std = 0.0

    historical_min = history["amount"].min()
    historical_max = history["amount"].max()

    # ---------------------------------------------------------
    # Current amount vs customer's normal amount
    # ---------------------------------------------------------

    if historical_mean > 0:
        amount_to_historical_mean = (
            current_amount / historical_mean
        )
    else:
        amount_to_historical_mean = 0.0

    if historical_std > 0:
        amount_zscore = (
            current_amount - historical_mean
        ) / historical_std
    else:
        amount_zscore = 0.0

    # ---------------------------------------------------------
    # Recent transaction activity
    # ---------------------------------------------------------

    one_hour_ago = current_time - pd.Timedelta(hours=1)
    one_day_ago = current_time - pd.Timedelta(days=1)
    seven_days_ago = current_time - pd.Timedelta(days=7)

    last_1h = history[
        history["transaction_time"] >= one_hour_ago
    ]

    last_24h = history[
        history["transaction_time"] >= one_day_ago
    ]

    last_7d = history[
        history["transaction_time"] >= seven_days_ago
    ]

    transactions_last_1h = len(last_1h)
    transactions_last_24h = len(last_24h)
    transactions_last_7d = len(last_7d)

    amount_last_24h = last_24h["amount"].sum()
    amount_last_7d = last_7d["amount"].sum()

    # ---------------------------------------------------------
    # Device behavior
    # ---------------------------------------------------------

    if current_device_id is None:
        new_device = 0
    elif "device_id" not in history.columns:
        new_device = 1
    else:
        previous_devices = (
            history["device_id"]
            .dropna()
            .tolist()
        )

        new_device = int(
            current_device_id not in previous_devices
        )

    # ---------------------------------------------------------
    # Location behavior
    # ---------------------------------------------------------

    if current_location_id is None:
        location_changed = 0
    elif "location_id" not in history.columns:
        location_changed = 1
    else:
        previous_locations = (
            history["location_id"]
            .dropna()
            .tolist()
        )

        location_changed = int(
            current_location_id not in previous_locations
        )

    # ---------------------------------------------------------
    # Unusual amount
    # ---------------------------------------------------------

    if historical_std > 0:
        is_unusual_amount = int(
            amount_zscore >= 3
        )
    else:
        is_unusual_amount = int(
            current_amount > historical_max
            and transaction_count >= 3
        )

    # ---------------------------------------------------------
    # Unusual transaction time
    # ---------------------------------------------------------

    historical_hours = (
        history["transaction_time"].dt.hour
    )

    current_hour = current_time.hour

    if len(historical_hours) >= 3:

        min_hour = historical_hours.min()
        max_hour = historical_hours.max()

        is_unusual_time = int(
            current_hour < min_hour
            or current_hour > max_hour
        )

    else:
        is_unusual_time = 0

    # ---------------------------------------------------------
    # Final feature vector
    # ---------------------------------------------------------

    return {
        "amount": current_amount,

        "transaction_hour": current_time.hour,

        "is_night": int(
            current_time.hour < 6
            or current_time.hour >= 22
        ),

        "is_weekend": int(
            current_time.weekday() >= 5
        ),

        "transaction_count": transaction_count,

        "historical_amount_mean": float(
            historical_mean
        ),

        "historical_amount_std": float(
            historical_std
        ),

        "historical_amount_min": float(
            historical_min
        ),

        "historical_amount_max": float(
            historical_max
        ),

        "amount_to_historical_mean": float(
            amount_to_historical_mean
        ),

        "amount_zscore": float(
            amount_zscore
        ),

        "transactions_last_1h": transactions_last_1h,

        "transactions_last_24h": transactions_last_24h,

        "transactions_last_7d": transactions_last_7d,

        "amount_last_24h": float(
            amount_last_24h
        ),

        "amount_last_7d": float(
            amount_last_7d
        ),

        "new_device": new_device,

        "location_changed": location_changed,

        "is_unusual_amount": is_unusual_amount,

        "is_unusual_time": is_unusual_time,
    }