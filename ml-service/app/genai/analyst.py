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


_client = Groq(api_key=GROQ_API_KEY)


def analyze_transaction(context: dict) -> FraudAnalysis:
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