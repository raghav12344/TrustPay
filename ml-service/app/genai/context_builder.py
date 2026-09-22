def build_genai_context(
    current_transaction: dict,
    previous_transactions: list[dict],
    features: dict,
    ml_prediction: dict,
):
    current_time = (
        current_transaction["transaction_time"]
    )

    recent_transactions = []

    for transaction in previous_transactions[-10:]:

        recent_transactions.append(
            {
                "amount": float(
                    transaction["amount"]
                ),

                "transaction_type": (
                    transaction[
                        "transaction_type"
                    ]
                ),

                "merchant": (
                    transaction.get(
                        "merchant"
                    )
                ),

                "transaction_time": str(
                    transaction[
                        "transaction_time"
                    ]
                ),

                "status": (
                    transaction["status"]
                ),
            }
        )

    context = {
        "current_transaction": {

            "amount": float(
                current_transaction["amount"]
            ),

            "transaction_type": (
                current_transaction[
                    "transaction_type"
                ]
            ),

            "merchant": (
                current_transaction.get(
                    "merchant"
                )
            ),

            "transaction_time": str(
                current_time
            ),

            "device_id": (
                current_transaction.get(
                    "device_id"
                )
            ),

            "location_id": (
                current_transaction.get(
                    "location_id"
                )
            ),
        },

        "customer_behavior": {

            "previous_transaction_count": (
                len(previous_transactions)
            ),

            "history_confidence": (
                features[
                    "history_confidence"
                ]
            ),

            "historical_amount_mean": round(
                features[
                    "historical_amount_mean"
                ],
                2,
            ),

            "historical_amount_std": round(
                features[
                    "historical_amount_std"
                ],
                2,
            ),

            "historical_amount_min": round(
                features[
                    "historical_amount_min"
                ],
                2,
            ),

            "historical_amount_max": round(
                features[
                    "historical_amount_max"
                ],
                2,
            ),

            "transactions_last_1h": (
                features[
                    "transactions_last_1h"
                ]
            ),

            "transactions_last_24h": (
                features[
                    "transactions_last_24h"
                ]
            ),

            "transactions_last_7d": (
                features[
                    "transactions_last_7d"
                ]
            ),

            "amount_last_24h": round(
                features[
                    "amount_last_24h"
                ],
                2,
            ),

            "amount_last_7d": round(
                features[
                    "amount_last_7d"
                ],
                2,
            ),

            "known_device": (
                features[
                    "known_device"
                ]
            ),

            "new_device": (
                features[
                    "new_device"
                ]
            ),

            "known_location": (
                features[
                    "known_location"
                ]
            ),

            "location_changed": (
                features[
                    "location_changed"
                ]
            ),

            "is_unusual_amount": (
                features[
                    "is_unusual_amount"
                ]
            ),

            "is_unusual_time": (
                features[
                    "is_unusual_time"
                ]
            ),
        },

        "ml_prediction": {

            "fraud_probability": round(
                ml_prediction[
                    "fraud_probability"
                ],
                4,
            ),

            "risk_score": (
                ml_prediction[
                    "risk_score"
                ]
            ),

            "risk_level": (
                ml_prediction[
                    "risk_level"
                ]
            ),
        },

        "recent_transactions": (
            recent_transactions
        ),
    }

    return context