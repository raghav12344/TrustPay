from app.decision.engine import (
    make_final_decision,
)


ml_prediction = {
    "fraud_probability": 0.04,
    "risk_score": 4.0,
    "risk_level": "LOW",
}


genai_analysis = {
    "risk_level": "LOW",
    "requires_admin_review": False,
    "reasons": [
        "Transaction amount is consistent with historical behavior.",
        "Known device detected.",
        "Transaction occurs during the customer's normal activity period.",
    ],
    "summary": (
        "The transaction is consistent with "
        "the customer's established behavior."
    ),
}


decision = make_final_decision(
    ml_prediction,
    genai_analysis,
)


print("\n===== TRUSTPAY FINAL DECISION =====")

print(
    "Risk level:",
    decision["final_risk_level"],
)

print(
    "Action:",
    decision["action"],
)

print(
    "Risk signals:",
    decision["risk_signals"],
)

print("\nReasons:")

for reason in decision["reasons"]:
    print("-", reason)