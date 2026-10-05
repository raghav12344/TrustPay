import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routes import router
from app.services.queue_consumer import start_rabbitmq_consumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    stop_event = asyncio.Event()
    consumer_task = asyncio.create_task(
        start_rabbitmq_consumer(stop_event)
    )
    yield
    stop_event.set()
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="TrustPay ML Service",
    description="AI-powered fraud detection and transaction risk analysis",
    version="1.0.0",
    lifespan=lifespan,
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
    db_status = "connected"
    try:
        from app.config.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
    except Exception:
        db_status = "reconnecting"

    return {
        "status": "healthy",
        "database": db_status,
    }