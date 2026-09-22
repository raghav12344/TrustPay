from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="TrustPay ML Service",
    description="AI-powered fraud detection and transaction risk analysis",
    version="1.0.0",
)

app.include_router(
    router,
    prefix="/api",
)


@app.get("/")
def root():
    return {
        "service": "TrustPay ML Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }