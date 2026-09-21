from fastapi import FastAPI

from app.schemas.prediction import (
    TransactionFeatures,
    PredictionResponse,
)

app = FastAPI(
    title="TrustPay ML Service",
    description="AI-powered fraud detection service",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "TrustPay ML Service",
        "status": "running",
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(transaction: TransactionFeatures):
    # Model will be connected here next
    return {
        "fraud_probability": 0.0,
        "risk_score": 0.0,
        "prediction": "LOW_RISK",
    }