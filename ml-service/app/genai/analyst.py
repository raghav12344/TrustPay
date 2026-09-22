import logging

from google import genai
from pydantic import BaseModel

from app.config.settings import GEMINI_API_KEY
from app.genai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


logger = logging.getLogger(__name__)


class FraudAnalysis(BaseModel):
    risk_level: str
    reasons: list[str]
    requires_admin_review: bool
    summary: str


_client = genai.Client(api_key=GEMINI_API_KEY)


def build_fallback_analysis(context: dict) -> FraudAnalysis:
    """
    Deterministic fallback used when Gemini is unavailable.

    The ML model remains the primary numerical risk assessment.
    """

    ml_prediction = context["ml_prediction"]
    features = context["customer_behavior"]

    risk_level = ml_prediction["risk_level"]

    reasons = []

    if features.get("is_unusual_amount", 0):
        reasons.append(
            "transaction amount is unusual compared with the customer's history"
        )

    if features.get("is_unusual_time", 0):
        reasons.append(
            "transaction occurred at an unusual time compared with the customer's history"
        )

    if features.get("new_device", 0):
        reasons.append(
            "transaction was initiated from a previously unseen device"
        )

    if features.get("location_changed", 0):
        reasons.append(
            "transaction occurred from a previously unseen location"
        )

    if not reasons:
        reasons.append(
            "no major behavioral anomaly was detected from the available history"
        )

    requires_admin_review = risk_level == "HIGH"

    summary = (
        "Gemini analysis was temporarily unavailable. "
        "The transaction was assessed using the ML fraud model "
        "and deterministic customer-behavior signals."
    )

    return FraudAnalysis(
        risk_level=risk_level,
        reasons=reasons,
        requires_admin_review=requires_admin_review,
        summary=summary,
    )


def analyze_transaction(context: dict):
    user_prompt = USER_PROMPT_TEMPLATE.format(
        customer_behavior=context["customer_behavior"],
        current_transaction=context["current_transaction"],
        recent_transactions=context["recent_transactions"],
        ml_prediction=context["ml_prediction"],
    )

    try:
        response = _client.models.generate_content(
            model="gemini-3.6-flash",
            contents=user_prompt,
            config={
                "system_instruction": SYSTEM_PROMPT,
                "response_mime_type": "application/json",
                "response_schema": FraudAnalysis,
            },
        )

        return FraudAnalysis.model_validate(response.parsed)

    except Exception as exc:
        logger.warning(
            "Gemini analysis unavailable. Using deterministic fallback. Error: %s",
            exc,
        )

        return build_fallback_analysis(context)