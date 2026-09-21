from pydantic import BaseModel


class TransactionFeatures(BaseModel):
    amount: float
    transaction_type: str
    hour: int
    device_trusted: bool
    merchant_known: bool


class PredictionResponse(BaseModel):
    fraud_probability: float
    risk_score: float
    prediction: str