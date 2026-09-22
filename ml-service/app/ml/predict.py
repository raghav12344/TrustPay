import joblib
import pandas as pd

from app.config.settings import ML_MODEL_PATH


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


_model = None


def get_model():
    """
    Load the LightGBM model once and reuse it.
    """

    global _model

    if _model is None:
        _model = joblib.load(
            ML_MODEL_PATH
        )

    return _model


def predict_fraud(features: dict):
    """
    Generate a fraud probability from customer-centric features.
    """

    model = get_model()

    feature_data = {
        column: [
            features.get(column, 0)
        ]
        for column in FEATURE_COLUMNS
    }

    dataframe = pd.DataFrame(
        feature_data
    )

    probability = float(
        model.predict_proba(
            dataframe
        )[0][1]
    )

    # Convert probability into a 0-100 score.
    risk_score = round(
        probability * 100,
        2,
    )

    # Initial risk categories.
    if probability >= 0.70:

        risk_level = "HIGH"

    elif probability >= 0.30:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    return {
        "fraud_probability": probability,
        "risk_score": risk_score,
        "risk_level": risk_level,
    }