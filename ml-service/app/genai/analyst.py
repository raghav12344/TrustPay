import json
import logging

from groq import Groq
from pydantic import BaseModel

from app.config.settings import GROQ_API_KEY, GROQ_MODEL
from app.genai.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


logger = logging.getLogger(__name__)


class FraudAnalysis(BaseModel):
    risk_level: str
    reasons: list[str]
    requires_admin_review: bool
    summary: str


_client = Groq(api_key=GROQ_API_KEY, timeout=15.0)


def _fallback_analysis(context: dict, error: Exception) -> FraudAnalysis:
    """
    Deterministic fallback used when the Groq API is unavailable,
    rate-limited, times out, or returns something we can't parse.

    This is intentionally conservative: it never blocks a
    transaction from being scored just because a third-party
    LLM call failed. The ML model's risk_level (already computed
    before this function is ever called) is reused as-is, so the
    downstream decision engine still gets a sane signal.
    """

    logger.error(
        "GenAI analysis failed, using fallback: %s",
        error,
    )

    ml_prediction = context.get("ml_prediction", {})
    risk_level = ml_prediction.get("risk_level", "MEDIUM")

    return FraudAnalysis(
        risk_level=risk_level,
        reasons=[
            "AI explanation unavailable "
            "(GenAI service error) — "
            "decision based on ML model output only.",
        ],
        requires_admin_review=(risk_level == "HIGH"),
        summary=(
            "Automated explanation could not be generated. "
            "Risk level reflects the machine learning model's "
            "prediction only."
        ),
    )


def analyze_transaction(context: dict) -> FraudAnalysis:
    try:
        user_prompt = USER_PROMPT_TEMPLATE.format(
            customer_behavior=context["customer_behavior"],
            current_transaction=context["current_transaction"],
            recent_transactions=context["recent_transactions"],
            ml_prediction=context["ml_prediction"],
        )

        response = _client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "fraud_analysis",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "risk_level": {
                                "type": "string",
                                "enum": [
                                    "LOW",
                                    "MEDIUM",
                                    "HIGH",
                                ],
                            },
                            "reasons": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                },
                            },
                            "requires_admin_review": {
                                "type": "boolean",
                            },
                            "summary": {
                                "type": "string",
                            },
                        },
                        "required": [
                            "risk_level",
                            "reasons",
                            "requires_admin_review",
                            "summary",
                        ],
                        "additionalProperties": False,
                    },
                },
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError(
                "Groq returned an empty response."
            )

        result = json.loads(content)

        return FraudAnalysis.model_validate(result)

    except Exception as error:
        # Network errors, timeouts, rate limits, malformed JSON,
        # schema validation failures, etc. all land here. A
        # third-party outage should never take down transaction
        # processing.
        return _fallback_analysis(context, error)