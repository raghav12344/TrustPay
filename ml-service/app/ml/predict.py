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

    # Convert probability into a 0-100 base score.
    base_risk_score = round(
        probability * 100,
        2,
    )

    # Calibrated risk score with deterministic physical multipliers
    calibrated_score = base_risk_score

    # 1. Impossible travel is a severe physical anomaly (teleportation/proxy jump)
    if features.get("is_impossible_travel", 0):
        calibrated_score = max(calibrated_score, 88.0)

    # 2. High burst velocity indicates automated bot / card-testing attack
    if features.get("is_burst_velocity", 0):
        calibrated_score = max(calibrated_score, min(95.0, calibrated_score + 25.0))

    # 3. High balance drain from novel device / location
    if features.get("is_high_balance_drain", 0):
        calibrated_score = max(calibrated_score, min(95.0, calibrated_score + 20.0))

    # 4. Extreme outlier (Z >= 3.5 or 5x mean)
    if features.get("is_extreme_outlier", 0):
        calibrated_score = max(calibrated_score, min(90.0, calibrated_score + 15.0))

    calibrated_score = round(min(100.0, max(0.0, calibrated_score)), 2)
    calibrated_probability = round(calibrated_score / 100.0, 4)

    # Risk categories
    if calibrated_probability >= 0.70:
        risk_level = "HIGH"
    elif calibrated_probability >= 0.30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "fraud_probability": calibrated_probability,
        "base_model_probability": probability,
        "risk_score": calibrated_score,
        "base_risk_score": base_risk_score,
        "risk_level": risk_level,
    }