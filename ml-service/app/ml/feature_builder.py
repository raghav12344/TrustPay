from datetime import timedelta

import pandas as pd


FEATURE_COLUMNS = [
    "amount",
    "transaction_hour",
    "is_night",
    "is_weekend",
    "transaction_count",
    "historical_amount_mean",
    "historical_amount_std",
    "historical_amount_min",
    "historical_amount_max",
    "amount_to_historical_mean",
    "amount_zscore",
    "transactions_last_1h",
    "transactions_last_24h",
    "transactions_last_7d",
    "amount_last_24h",
    "amount_last_7d",
    "new_device",
    "location_changed",
    "is_unusual_amount",
    "is_unusual_time",
]


def build_training_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build customer-centric features without data leakage.

    For every transaction, only transactions occurring BEFORE
    that transaction are used to calculate historical features.
    """

    df = df.copy()

    df["transaction_time"] = pd.to_datetime(
        df["transaction_time"]
    )

    df = df.sort_values(
        [
            "customer_id",
            "transaction_time",
        ]
    ).reset_index(drop=True)

    feature_rows = []

    for customer_id, customer_df in df.groupby(
        "customer_id",
        sort=False,
    ):

        history = []

        for _, current in customer_df.iterrows():

            current_time = current["transaction_time"]
            current_amount = float(current["amount"])
            current_hour = current_time.hour

            # --------------------------------------------------
            # Current transaction
            # --------------------------------------------------

            is_night = int(
                current_hour >= 22
                or current_hour < 6
            )

            is_weekend = int(
                current_time.weekday() >= 5
            )

            # --------------------------------------------------
            # Historical amounts
            # --------------------------------------------------

            historical_amounts = [
                float(t["amount"])
                for t in history
            ]

            if historical_amounts:

                historical_mean = (
                    sum(historical_amounts)
                    / len(historical_amounts)
                )

                historical_min = min(
                    historical_amounts
                )

                historical_max = max(
                    historical_amounts
                )

                if len(historical_amounts) >= 2:

                    historical_std = (
                        pd.Series(
                            historical_amounts
                        ).std()
                    )

                else:
                    historical_std = 0.0

            else:

                historical_mean = 0.0
                historical_std = 0.0
                historical_min = 0.0
                historical_max = 0.0

            # --------------------------------------------------
            # Amount deviation
            # --------------------------------------------------

            if historical_mean > 0:

                amount_to_historical_mean = (
                    current_amount
                    / historical_mean
                )

            else:

                amount_to_historical_mean = 0.0

            if historical_std > 0:

                amount_zscore = (
                    (
                        current_amount
                        - historical_mean
                    )
                    / historical_std
                )

            else:

                amount_zscore = 0.0

            # --------------------------------------------------
            # Recent activity
            # --------------------------------------------------

            transactions_last_1h = 0
            transactions_last_24h = 0
            transactions_last_7d = 0

            amount_last_24h = 0.0
            amount_last_7d = 0.0

            for transaction in history:

                previous_time = transaction[
                    "transaction_time"
                ]

                difference = (
                    current_time
                    - previous_time
                )

                if difference <= timedelta(
                    hours=1
                ):

                    transactions_last_1h += 1

                if difference <= timedelta(
                    days=1
                ):

                    transactions_last_24h += 1

                    amount_last_24h += float(
                        transaction["amount"]
                    )

                if difference <= timedelta(
                    days=7
                ):

                    transactions_last_7d += 1

                    amount_last_7d += float(
                        transaction["amount"]
                    )

            # --------------------------------------------------
            # Device behavior
            # --------------------------------------------------

            previous_devices = {
                t["device_id"]
                for t in history
            }

            new_device = int(
                current["device_id"]
                not in previous_devices
            )

            # --------------------------------------------------
            # Location behavior
            # --------------------------------------------------

            previous_locations = {
                t["location_id"]
                for t in history
            }

            location_changed = int(
                current["location_id"]
                not in previous_locations
            )

            # --------------------------------------------------
            # Unusual amount
            # --------------------------------------------------

            is_unusual_amount = int(
                historical_mean > 0
                and current_amount
                > historical_mean * 3
            )

            # --------------------------------------------------
            # Unusual time
            # --------------------------------------------------

            historical_hours = [
                t["transaction_time"].hour
                for t in history
            ]

            if historical_hours:

                hour_counts = {}

                for hour in historical_hours:

                    hour_counts[hour] = (
                        hour_counts.get(
                            hour,
                            0,
                        )
                        + 1
                    )

                most_common_hour = max(
                    hour_counts,
                    key=hour_counts.get,
                )

                is_unusual_time = int(
                    abs(
                        current_hour
                        - most_common_hour
                    )
                    >= 6
                )

            else:

                is_unusual_time = 0

            # --------------------------------------------------
            # Create feature row
            # --------------------------------------------------

            feature_row = {
                "amount": current_amount,

                "transaction_hour":
                    current_hour,

                "is_night":
                    is_night,

                "is_weekend":
                    is_weekend,

                "transaction_count":
                    len(history),

                "historical_amount_mean":
                    historical_mean,

                "historical_amount_std":
                    historical_std,

                "historical_amount_min":
                    historical_min,

                "historical_amount_max":
                    historical_max,

                "amount_to_historical_mean":
                    amount_to_historical_mean,

                "amount_zscore":
                    amount_zscore,

                "transactions_last_1h":
                    transactions_last_1h,

                "transactions_last_24h":
                    transactions_last_24h,

                "transactions_last_7d":
                    transactions_last_7d,

                "amount_last_24h":
                    amount_last_24h,

                "amount_last_7d":
                    amount_last_7d,

                "new_device":
                    new_device,

                "location_changed":
                    location_changed,

                "is_unusual_amount":
                    is_unusual_amount,

                "is_unusual_time":
                    is_unusual_time,

                "is_fraud":
                    int(current["is_fraud"]),
            }

            feature_rows.append(
                feature_row
            )

            # --------------------------------------------------
            # IMPORTANT:
            # Add current transaction to history
            # ONLY AFTER features are calculated.
            # --------------------------------------------------

            history.append(
                current.to_dict()
            )

    return pd.DataFrame(feature_rows)


if __name__ == "__main__":

    input_path = (
        "data/raw/"
        "training_transactions.csv"
    )

    output_path = (
        "data/processed/"
        "training_features.csv"
    )

    df = pd.read_csv(
        input_path
    )

    features = build_training_features(
        df
    )

    features.to_csv(
        output_path,
        index=False,
    )

    print(
        f"Created: {output_path}"
    )

    print(
        f"Rows: {len(features)}"
    )

    print(
        f"Features: "
        f"{len(FEATURE_COLUMNS)}"
    )

    print(
        "\nFraud distribution:"
    )

    print(
        features["is_fraud"].value_counts()
    )

    print(
        "\nFeature columns:"
    )

    for column in FEATURE_COLUMNS:
        print(
            f"- {column}"
        )