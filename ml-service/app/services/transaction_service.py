from datetime import datetime

from app.config.database import get_db_connection


def get_customer_transactions(
    user_id: int,
    current_transaction_time: datetime,
):
    """
    Get all previous transactions for a customer.

    Only transactions that occurred before the current transaction
    are returned to prevent data leakage.
    """

    connection = get_db_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                t.transaction_id,
                t.account_id,
                t.device_id,
                t.location_id,
                t.amount,
                t.transaction_type,
                t.merchant,
                t.transaction_time,
                t.status
            FROM transactions t
            INNER JOIN accounts a
                ON t.account_id = a.account_id
            WHERE a.user_id = %s
              AND t.transaction_time < %s
            ORDER BY t.transaction_time ASC
        """

        cursor.execute(
            query,
            (
                user_id,
                current_transaction_time,
            ),
        )

        return cursor.fetchall()

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()