import asyncio
import json
import aio_pika

from app.config.settings import (
    RABBITMQ_URL,
    FRAUD_EVALUATION_QUEUE,
)
from app.schemas.transaction import TransactionRequest
from app.services.transaction_service import (
    get_customer_transactions,
    get_location_by_id,
)
from app.services.feature_service import build_customer_features
from app.ml.predict import predict_fraud
from app.genai.context_builder import build_genai_context
from app.genai.analyst import analyze_transaction
from app.decision.engine import make_final_decision
from app.services.settlement_service import settle_evaluated_transaction


def evaluate_and_settle_sync(payload_dict: dict) -> dict:
    """
    Executes the 5-stage fraud pipeline (Features -> LightGBM -> Context -> Groq LLM -> Decision)
    and updates the MySQL ledger directly.
    """
    tx_request = TransactionRequest(**payload_dict)

    previous_transactions = get_customer_transactions(
        user_id=tx_request.user_id,
        current_transaction_time=tx_request.transaction_time,
    )

    current_transaction = tx_request.model_dump()

    if current_transaction.get("location_id") and (
        current_transaction.get("latitude") is None
        or current_transaction.get("longitude") is None
    ):
        loc_row = get_location_by_id(current_transaction["location_id"])
        if loc_row:
            current_transaction["latitude"] = (
                float(loc_row["latitude"])
                if loc_row.get("latitude") is not None
                else None
            )
            current_transaction["longitude"] = (
                float(loc_row["longitude"])
                if loc_row.get("longitude") is not None
                else None
            )
            current_transaction["city"] = loc_row.get("city")

    features = build_customer_features(
        current_transaction=current_transaction,
        previous_transactions=previous_transactions,
    )

    ml_prediction = predict_fraud(features)

    genai_context = build_genai_context(
        current_transaction=current_transaction,
        previous_transactions=previous_transactions,
        features=features,
        ml_prediction=ml_prediction,
    )

    genai_analysis = analyze_transaction(genai_context)

    final_decision = make_final_decision(
        ml_prediction=ml_prediction,
        genai_analysis=genai_analysis.model_dump(),
        features=features,
    )

    settlement = None
    if tx_request.transaction_id is not None:
        settlement = settle_evaluated_transaction(
            transaction_id=tx_request.transaction_id,
            account_id=tx_request.account_id,
            amount=tx_request.amount,
            transaction_type=tx_request.transaction_type,
            ml_prediction=ml_prediction,
            final_decision=final_decision,
        )

    return {
        "transaction_id": tx_request.transaction_id,
        "ml_prediction": ml_prediction,
        "genai_analysis": genai_analysis.model_dump(),
        "final_decision": final_decision,
        "settlement": settlement,
    }


async def on_fraud_evaluation_message(
    message: aio_pika.abc.AbstractIncomingMessage,
) -> None:
    """
    Callback triggered for each message arriving on `fraud_evaluation_queue`.
    """
    async with message.process(requeue=False):
        try:
            payload = json.loads(message.body.decode("utf-8"))
            tx_id = payload.get("transaction_id")
            print(
                f"[RABBITMQ CONSUMER] Processing transaction #{tx_id} from '{FRAUD_EVALUATION_QUEUE}'..."
            )

            result = await asyncio.to_thread(evaluate_and_settle_sync, payload)

            settlement_status = (
                result["settlement"]["status"]
                if result.get("settlement")
                else "EVALUATED"
            )
            risk_level = result["final_decision"]["final_risk_level"]
            action = result["final_decision"]["action"]

            print(
                f"[RABBITMQ CONSUMER] Completed transaction #{tx_id}: "
                f"Risk={risk_level}, Action={action}, LedgerStatus={settlement_status}"
            )
        except Exception as exc:
            print(
                f"[RABBITMQ CONSUMER] Error processing message: {exc}"
            )


async def start_rabbitmq_consumer(stop_event: asyncio.Event) -> None:
    """
    Background loop that maintains a robust connection to RabbitMQ
    and consumes from `fraud_evaluation_queue`.
    """
    while not stop_event.is_set():
        connection = None
        try:
            print(
                f"[RABBITMQ CONSUMER] Connecting to broker at {RABBITMQ_URL}..."
            )
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=10)

            queue = await channel.declare_queue(
                FRAUD_EVALUATION_QUEUE,
                durable=True,
            )

            await queue.consume(on_fraud_evaluation_message)
            print(
                f"[RABBITMQ CONSUMER] Actively consuming from '{FRAUD_EVALUATION_QUEUE}'."
            )

            await stop_event.wait()

        except asyncio.CancelledError:
            break
        except Exception as exc:
            print(
                f"[RABBITMQ CONSUMER] Broker connection unavailable ({exc}). Retrying in 5s..."
            )
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                pass
        finally:
            if connection and not connection.is_closed:
                await connection.close()
