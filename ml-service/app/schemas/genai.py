from pydantic import BaseModel


class GenAIAnalysis(BaseModel):
    risk_level: str

    reasons: list[str]

    requires_admin_review: bool

    summary: str