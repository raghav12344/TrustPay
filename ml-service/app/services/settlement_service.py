from app.config.database import get_db_connection


PREDICTION_MAP = {
    "LOW": "LOW_RISK",
    "MEDIUM": "MEDIUM_RISK",
    "HIGH": "HIGH_RISK",
}


def settle_evaluated_transaction(
    transaction_id: int,
    account_id: int,
    amount: float,
    transaction_type: str,
    ml_prediction: dict,
    final_decision: dict,
) -> dict:
    """
    Persists the ML prediction and settles the transaction in MySQL atomically.

    - Inserts a record into `fraud_predictions`.
    - If `final_risk_level == 'HIGH'` and `action == 'ADMIN_REVIEW'`:
        Inserts an `OPEN` alert into `fraud_alerts` and keeps the transaction `PENDING`.
    - Otherwise (LOW / MEDIUM risk):
        Updates the transaction status to `APPROVED` and adjusts the `accounts.balance`
        idempotently (only if the transaction transitioned from `PENDING` to `APPROVED`).
    """
    mapped_prediction = PREDICTION_MAP.get(ml_prediction.get("risk_level"))
    if not mapped_prediction:
        raise ValueError(
            f"Invalid ML risk level: {ml_prediction.get('risk_level')}"
        )

    connection = get_db_connection()
    cursor = None

    try:
        cursor = connection.cursor()

        # 1. Insert ML Fraud Prediction
        cursor.execute(
            """
            INSERT INTO fraud_predictions
            (
                transaction_id,
                model_id,
                fraud_probability,
                risk_score,
                prediction
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                transaction_id,
                "trustpay-lightgbm-v1",
                float(ml_prediction["fraud_probability"]),
                float(ml_prediction["risk_score"]),
                mapped_prediction,
            ),
        )
        prediction_id = cursor.lastrowid

        # 2. Check if HIGH Risk -> Flag for Admin Review
        final_risk = final_decision.get("final_risk_level")
        action = final_decision.get("action")

        if final_risk == "HIGH" and action == "ADMIN_REVIEW":
            reasons_str = "; ".join(final_decision.get("reasons", []))
            cursor.execute(
                """
                INSERT INTO fraud_alerts
                (
                    transaction_id,
                    prediction_id,
                    severity,
                    reason,
                    status
                )
                VALUES (%s, %s, %s, %s, 'OPEN')
                """,
                (
                    transaction_id,
                    prediction_id,
                    final_risk,
                    reasons_str,
                ),
            )
            connection.commit()
            return {
                "transaction_id": transaction_id,
                "prediction_id": prediction_id,
                "status": "PENDING",
                "action": "ADMIN_REVIEW",
            }

        # 3. LOW / MEDIUM Risk -> Approve Transaction & Update Balance Idempotently
        cursor.execute(
            """
            UPDATE transactions
            SET status = 'APPROVED'
            WHERE transaction_id = %s AND status = 'PENDING'
            """,
            (transaction_id,),
        )

        if cursor.rowcount > 0:
            if str(transaction_type).upper() == "DEPOSIT":
                cursor.execute(
                    """
                    UPDATE accounts
                    SET balance = balance + %s
                    WHERE account_id = %s
                    """,
                    (float(amount), account_id),
                )
            else:
                cursor.execute(
                    """
                    UPDATE accounts
                    SET balance = balance - %s
                    WHERE account_id = %s
                    """,
                    (float(amount), account_id),
                )

        connection.commit()
        return {
            "transaction_id": transaction_id,
            "prediction_id": prediction_id,
            "status": "APPROVED",
            "action": action,
        }

    except Exception:
        connection.rollback()
        raise
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()
