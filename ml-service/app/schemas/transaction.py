from datetime import datetime

from pydantic import BaseModel, Field


class TransactionRequest(BaseModel):
    user_id: int

    account_id: int

    amount: float = Field(
        gt=0
    )

    transaction_type: str

    merchant: str | None = None

    transaction_time: datetime

    device_id: int | None = None

    location_id: int | None = None