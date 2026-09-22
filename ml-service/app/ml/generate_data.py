import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


RANDOM_SEED = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


NUM_CUSTOMERS = 1000
TRANSACTIONS_PER_CUSTOMER = 100


TRANSACTION_TYPES = [
    "TRANSFER",
    "PAYMENT",
    "WITHDRAWAL",
    "DEPOSIT",
]


def generate_dataset():
    rows = []

    start_date = datetime(2025, 1, 1)

    for customer_id in range(1, NUM_CUSTOMERS + 1):

        # --------------------------------------------------
        # Normal customer behavior
        # --------------------------------------------------

        normal_mean = random.uniform(500, 5000)
        normal_std = normal_mean * random.uniform(0.15, 0.40)

        normal_hour = random.randint(8, 20)

        normal_device = random.randint(
            1,
            3,
        )

        normal_location = random.randint(
            1,
            5,
        )

        previous_times = []

        for transaction_number in range(
            TRANSACTIONS_PER_CUSTOMER
        ):

            # --------------------------------------------------
            # Transaction time
            # --------------------------------------------------

            if previous_times:

                previous_time = previous_times[-1]

                transaction_time = (
                    previous_time
                    + timedelta(
                        hours=random.uniform(
                            1,
                            72,
                        )
                    )
                )

            else:

                transaction_time = (
                    start_date
                    + timedelta(
                        days=random.randint(
                            0,
                            30,
                        )
                    )
                )

            previous_times.append(
                transaction_time
            )

            # --------------------------------------------------
            # Decide whether this transaction is anomalous
            # --------------------------------------------------

            is_fraud = random.random() < 0.035

            # --------------------------------------------------
            # Normal transaction
            # --------------------------------------------------

            if not is_fraud:

                amount = max(
                    10,
                    np.random.normal(
                        normal_mean,
                        normal_std,
                    ),
                )

                hour = int(
                    np.clip(
                        np.random.normal(
                            normal_hour,
                            2,
                        ),
                        0,
                        23,
                    )
                )

                device_id = normal_device

                location_id = normal_location

            # --------------------------------------------------
            # Fraudulent transaction
            # --------------------------------------------------

            else:

                fraud_pattern = random.choice(
                    [
                        "large_amount",
                        "new_device",
                        "new_location",
                        "unusual_time",
                        "combined",
                    ]
                )

                amount = max(
                    10,
                    np.random.normal(
                        normal_mean * 8,
                        normal_mean * 2,
                    ),
                )

                hour = normal_hour

                device_id = normal_device

                location_id = normal_location

                if fraud_pattern == "new_device":

                    device_id = random.randint(
                        10,
                        100,
                    )

                elif fraud_pattern == "new_location":

                    location_id = random.randint(
                        10,
                        100,
                    )

                elif fraud_pattern == "unusual_time":

                    hour = random.choice(
                        [
                            0,
                            1,
                            2,
                            3,
                            4,
                            5,
                            23,
                        ]
                    )

                elif fraud_pattern == "combined":

                    device_id = random.randint(
                        10,
                        100,
                    )

                    location_id = random.randint(
                        10,
                        100,
                    )

                    hour = random.choice(
                        [
                            0,
                            1,
                            2,
                            3,
                            4,
                            5,
                        ]
                    )

            transaction_type = random.choice(
                TRANSACTION_TYPES
            )

            rows.append(
                {
                    "customer_id": customer_id,
                    "transaction_id": (
                        f"T{customer_id:04d}"
                        f"{transaction_number:04d}"
                    ),
                    "amount": round(
                        float(amount),
                        2,
                    ),
                    "transaction_type":
                        transaction_type,
                    "transaction_time":
                        transaction_time,
                    "device_id":
                        device_id,
                    "location_id":
                        location_id,
                    "is_fraud":
                        int(is_fraud),
                }
            )

    return pd.DataFrame(rows)


if __name__ == "__main__":

    df = generate_dataset()

    output_path = (
        "data/raw/training_transactions.csv"
    )

    df.to_csv(
        output_path,
        index=False,
    )

    print(
        f"Dataset created: {output_path}"
    )

    print(
        f"Rows: {len(df)}"
    )

    print(
        f"Fraud transactions: "
        f"{df['is_fraud'].sum()}"
    )

    print(
        f"Fraud rate: "
        f"{df['is_fraud'].mean():.4%}"
    )