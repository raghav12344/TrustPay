def make_final_decision(
    ml_prediction: dict,
    genai_analysis: dict,
    features: dict,
):
    fraud_probability = float(
        ml_prediction["fraud_probability"]
    )

    transaction_count = int(
        features.get(
            "transaction_count",
            0
        )
    )

    history_confidence = features.get(
        "history_confidence",
        "NONE"
    )

    unusual_amount = bool(
        features.get(
            "is_unusual_amount",
            0
        )
    )

    unusual_time = bool(
        features.get(
            "is_unusual_time",
            0
        )
    )

    new_device = bool(
        features.get(
            "new_device",
            0
        )
    )

    known_device = bool(
        features.get(
            "known_device",
            0
        )
    )

    location_changed = bool(
        features.get(
            "location_changed",
            0
        )
    )

    known_location = bool(
        features.get(
            "known_location",
            0
        )
    )

    # ---------------------------------------------------------
    # Count behavioral anomalies
    # ---------------------------------------------------------

    behavioral_signals = sum(
        [
            unusual_amount,
            unusual_time,
            new_device,
            location_changed,
        ]
    )

    # ---------------------------------------------------------
    # COLD START
    #
    # The customer has never made a transaction before.
    #
    # We cannot compare:
    # - amount
    # - device
    # - location
    # - transaction time
    #
    # against customer history.
    #
    # Therefore we use the ML prediction as the main
    # available signal, but we do not treat lack of history
    # as fraud.
    # ---------------------------------------------------------

    if transaction_count == 0:

        # Very high ML risk -> human review.
        if fraud_probability >= 0.70:

            return {
                "final_risk_level": "HIGH",
                "action": "ADMIN_REVIEW",
                "risk_signals": 1,
                "reasons": genai_analysis.get(
                    "reasons",
                    []
                ),
            }

        # Moderate ML risk -> monitor.
        return {
            "final_risk_level": "MEDIUM",
            "action": "MONITOR",
            "risk_signals": 0,
            "reasons": genai_analysis.get(
                "reasons",
                []
            ),
        }

    # ---------------------------------------------------------
    # ESTABLISHED CUSTOMER
    #
    # From this point we have customer history.
    # ---------------------------------------------------------

    # ---------------------------------------------------------
    # HIGH RISK:
    #
    # New device + changed location + unusual amount
    # ---------------------------------------------------------

    if (
        new_device
        and location_changed
        and unusual_amount
    ):

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": genai_analysis.get(
                "reasons",
                []
            ),
        }

    # ---------------------------------------------------------
    # HIGH RISK:
    #
    # Very high ML probability + unusual customer amount
    # ---------------------------------------------------------

    if (
        fraud_probability >= 0.70
        and unusual_amount
    ):

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": genai_analysis.get(
                "reasons",
                []
            ),
        }

    # ---------------------------------------------------------
    # MEDIUM:
    #
    # New device
    # OR changed location
    # OR unusual amount
    # OR moderate ML risk
    # ---------------------------------------------------------

    if (
        new_device
        or location_changed
        or unusual_amount
        or fraud_probability >= 0.30
    ):

        return {
            "final_risk_level": "MEDIUM",
            "action": "MONITOR",
            "risk_signals": behavioral_signals,
            "reasons": genai_analysis.get(
                "reasons",
                []
            ),
        }

    # ---------------------------------------------------------
    # LOW:
    #
    # Established/familiar customer behavior.
    # ---------------------------------------------------------

    if (
        known_device
        and known_location
        and not unusual_amount
        and not unusual_time
        and fraud_probability < 0.30
    ):

        return {
            "final_risk_level": "LOW",
            "action": "AUTO_APPROVE",
            "risk_signals": behavioral_signals,
            "reasons": genai_analysis.get(
                "reasons",
                []
            ),
        }

    # ---------------------------------------------------------
    # Default
    # ---------------------------------------------------------

    return {
        "final_risk_level": "LOW",
        "action": "AUTO_APPROVE",
        "risk_signals": behavioral_signals,
        "reasons": genai_analysis.get(
            "reasons",
            []
        ),
    }