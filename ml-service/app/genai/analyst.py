import time

from google import genai
from google.genai import errors
from pydantic import BaseModel

from app.config.settings import GEMINI_API_KEY
from app.genai.prompts import (
    SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE,
)


class FraudAnalysis(BaseModel):
    risk_level: str
    reasons: list[str]
    requires_admin_review: bool
    summary: str


_client = genai.Client(
    api_key=GEMINI_API_KEY
)


def analyze_transaction(
    context: dict,
    max_retries: int = 4,
):
    """
    Analyze a transaction using Gemini.

    Gemini provides contextual analysis and explanation.
    It does not make the final transaction decision.

    Temporary Gemini 503 errors are retried with
    exponential backoff.
    """

    user_prompt = USER_PROMPT_TEMPLATE.format(
        customer_behavior=context[
            "customer_behavior"
        ],
        current_transaction=context[
            "current_transaction"
        ],
        recent_transactions=context[
            "recent_transactions"
        ],
        ml_prediction=context[
            "ml_prediction"
        ],
    )

    for attempt in range(max_retries):

        try:

            response = _client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=user_prompt,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "response_schema": FraudAnalysis,
                    "thinking_config": {
                    "thinking_level": "minimal"
        },
    },
)

            return FraudAnalysis.model_validate(
                response.parsed
            )

        except errors.ServerError as error:

            if error.code != 503:
                raise

            if attempt == max_retries - 1:
                raise

            wait_time = 2 ** attempt

            print(
                f"Gemini temporarily unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)

    raise RuntimeError(
        "Gemini analysis failed after retries."
    )