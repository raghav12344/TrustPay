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
    # Advanced Telemetry Signals
    # ---------------------------------------------------------

    is_impossible_travel = bool(
        features.get("is_impossible_travel", 0)
    )

    travel_speed_kmh = float(
        features.get("travel_speed_kmh", 0.0)
    )

    distance_from_last_km = float(
        features.get("distance_from_last_km", 0.0)
    )

    is_burst_velocity = bool(
        features.get("is_burst_velocity", 0)
    )

    transactions_last_10m = int(
        features.get("transactions_last_10m", 0)
    )

    is_high_balance_drain = bool(
        features.get("is_high_balance_drain", 0)
    )

    is_extreme_outlier = bool(
        features.get("is_extreme_outlier", 0)
    )

    is_distant_location = bool(
        features.get("is_distant_location", 0)
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
            is_impossible_travel,
            is_burst_velocity,
            is_high_balance_drain,
            is_extreme_outlier,
        ]
    )

    reasons = list(genai_analysis.get("reasons", []))

    def ensure_reason(msg: str):
        if msg and not any(msg.lower() in r.lower() for r in reasons):
            reasons.insert(0, msg)
        return reasons

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
                "reasons": ensure_reason(
                    "Elevated ML risk detected on initial customer transaction."
                ),
            }

        # Moderate ML risk -> monitor.
        return {
            "final_risk_level": "MEDIUM",
            "action": "MONITOR",
            "risk_signals": 0,
            "reasons": reasons,
        }

    # ---------------------------------------------------------
    # ESTABLISHED CUSTOMER
    #
    # From this point we have customer history.
    # ---------------------------------------------------------

    # ---------------------------------------------------------
    # HIGH RISK: IMPOSSIBLE TRAVEL (Teleportation / Geo-Hopping)
    # ---------------------------------------------------------

    if is_impossible_travel:

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": ensure_reason(
                f"CRITICAL: Impossible travel detected ({distance_from_last_km:.1f} km at implied speed of {travel_speed_kmh:.1f} km/h)."
            ),
        }

    # ---------------------------------------------------------
    # HIGH RISK: ACCOUNT TAKEOVER (ATO) TRIAD
    #
    # New device + changed/distant location + unusual amount/drain
    # ---------------------------------------------------------

    if (
        new_device
        and (location_changed or is_distant_location)
        and (unusual_amount or is_high_balance_drain)
    ):

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": ensure_reason(
                "Potential Account Takeover: Novel device and geographic shift combined with abnormal capital withdrawal."
            ),
        }

    # ---------------------------------------------------------
    # HIGH RISK: BURST VELOCITY / AUTOMATED BOT TESTING
    # ---------------------------------------------------------

    if is_burst_velocity and (new_device or fraud_probability >= 0.40):

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": ensure_reason(
                f"Velocity Spike: Rapid burst of {transactions_last_10m} transactions initiated within 10 minutes."
            ),
        }

    # ---------------------------------------------------------
    # HIGH RISK: CAPITAL DEPLETION (BALANCE DRAIN) ON FRESH DEVICE
    # ---------------------------------------------------------

    if is_high_balance_drain and new_device:

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": ensure_reason(
                "High balance depletion: transaction attempts to withdraw over 85% of available funds from an unverified device."
            ),
        }

    # ---------------------------------------------------------
    # HIGH RISK:
    #
    # Very high ML probability + unusual customer amount or extreme outlier
    # ---------------------------------------------------------

    if (
        fraud_probability >= 0.70
        and (unusual_amount or is_extreme_outlier)
    ) or (
        is_extreme_outlier and new_device
    ):

        return {
            "final_risk_level": "HIGH",
            "action": "ADMIN_REVIEW",
            "risk_signals": behavioral_signals,
            "reasons": ensure_reason(
                "Severe transaction value outlier significantly exceeding customer historical expenditure."
            ),
        }

    # ---------------------------------------------------------
    # MEDIUM:
    #
    # New device
    # OR changed location
    # OR unusual amount
    # OR burst velocity
    # OR distant location
    # OR moderate ML risk
    # ---------------------------------------------------------

    if (
        new_device
        or location_changed
        or unusual_amount
        or is_burst_velocity
        or is_distant_location
        or fraud_probability >= 0.30
    ):

        return {
            "final_risk_level": "MEDIUM",
            "action": "MONITOR",
            "risk_signals": behavioral_signals,
            "reasons": reasons,
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
        and not is_burst_velocity
        and fraud_probability < 0.30
    ):

        return {
            "final_risk_level": "LOW",
            "action": "AUTO_APPROVE",
            "risk_signals": behavioral_signals,
            "reasons": reasons,
        }

    # ---------------------------------------------------------
    # Default
    # ---------------------------------------------------------

    return {
        "final_risk_level": "LOW",
        "action": "AUTO_APPROVE",
        "risk_signals": behavioral_signals,
        "reasons": reasons,
    }