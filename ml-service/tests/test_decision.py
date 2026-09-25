from app.decision.engine import make_final_decision


def _features(**overrides):
    base = {
        "transaction_count": 5,
        "history_confidence": "ESTABLISHED",
        "is_unusual_amount": 0,
        "is_unusual_time": 0,
        "new_device": 0,
        "known_device": 1,
        "location_changed": 0,
        "known_location": 1,
    }
    base.update(overrides)
    return base


def _genai(reasons=None):
    return {
        "risk_level": "LOW",
        "reasons": reasons or [],
        "requires_admin_review": False,
        "summary": "test",
    }


def test_cold_start_high_ml_probability_goes_to_admin_review():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.9, "risk_score": 90, "risk_level": "HIGH"},
        genai_analysis=_genai(),
        features=_features(transaction_count=0),
    )

    assert decision["final_risk_level"] == "HIGH"
    assert decision["action"] == "ADMIN_REVIEW"


def test_cold_start_moderate_ml_probability_is_monitored():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.5, "risk_score": 50, "risk_level": "MEDIUM"},
        genai_analysis=_genai(),
        features=_features(transaction_count=0),
    )

    assert decision["final_risk_level"] == "MEDIUM"
    assert decision["action"] == "MONITOR"


def test_established_customer_new_device_location_and_unusual_amount_is_high_risk():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.4, "risk_score": 40, "risk_level": "MEDIUM"},
        genai_analysis=_genai(),
        features=_features(
            new_device=1,
            known_device=0,
            location_changed=1,
            known_location=0,
            is_unusual_amount=1,
        ),
    )

    assert decision["final_risk_level"] == "HIGH"
    assert decision["action"] == "ADMIN_REVIEW"


def test_established_customer_high_probability_and_unusual_amount_is_high_risk():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.8, "risk_score": 80, "risk_level": "HIGH"},
        genai_analysis=_genai(),
        features=_features(is_unusual_amount=1),
    )

    assert decision["final_risk_level"] == "HIGH"
    assert decision["action"] == "ADMIN_REVIEW"


def test_established_customer_familiar_everything_is_low_risk():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.05, "risk_score": 5, "risk_level": "LOW"},
        genai_analysis=_genai(),
        features=_features(),
    )

    assert decision["final_risk_level"] == "LOW"
    assert decision["action"] == "AUTO_APPROVE"


def test_established_customer_new_device_alone_is_medium_risk():
    decision = make_final_decision(
        ml_prediction={"fraud_probability": 0.1, "risk_score": 10, "risk_level": "LOW"},
        genai_analysis=_genai(),
        features=_features(new_device=1, known_device=0),
    )

    assert decision["final_risk_level"] == "MEDIUM"
    assert decision["action"] == "MONITOR"
