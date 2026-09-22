import os

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ML_MODEL_PATH = os.getenv(
    "ML_MODEL_PATH",
    "app/model/fraud_model.joblib",
)


if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not configured."
    )


if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is not configured."
    )