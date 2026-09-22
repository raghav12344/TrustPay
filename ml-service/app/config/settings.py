import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

ML_MODEL_PATH = os.getenv(
    "ML_MODEL_PATH",
    "app/model/fraud_model.joblib",
)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not configured.")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not configured.")