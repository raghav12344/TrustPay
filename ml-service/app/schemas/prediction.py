from pydantic import BaseModel


class MLPrediction(BaseModel):
    fraud_probability: float
    risk_score: float
    risk_level: str


class GenAIAnalysis(BaseModel):
    risk_level: str
    reasons: list[str]
    requires_admin_review: bool
    summary: str


class FinalDecision(BaseModel):
    final_risk_level: str
    action: str
    risk_signals: int
    reasons: list[str]


class FraudAnalysisResponse(BaseModel):
    ml_prediction: MLPrediction
    genai_analysis: GenAIAnalysis
    final_decision: FinalDecision