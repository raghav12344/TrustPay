from fastapi import APIRouter

from app.schemas.transaction import (
    TransactionRequest,
)

from app.schemas.prediction import (
    FraudAnalysisResponse,
)

from app.services.transaction_service import (
    get_customer_transactions,
    get_location_by_id,
)

from app.services.feature_service import (
    build_customer_features,
)

from app.ml.predict import (
    predict_fraud,
)

from app.genai.context_builder import (
    build_genai_context,
)

from app.genai.analyst import (
    analyze_transaction,
)

from app.decision.engine import (
    make_final_decision,
)


router = APIRouter()


@router.post(
    "/analyze",
    response_model=FraudAnalysisResponse,
)
def analyze_transaction_route(
    transaction: TransactionRequest,
):

    # ---------------------------------------------------------
    # 1. Get previous customer transactions
    #
    # The current transaction is NOT included.
    # ---------------------------------------------------------

    previous_transactions = (
        get_customer_transactions(
            user_id=transaction.user_id,
            current_transaction_time=(
                transaction.transaction_time
            ),
        )
    )

    # ---------------------------------------------------------
    # 2. Convert request to dictionary
    # ---------------------------------------------------------

    current_transaction = (
        transaction.model_dump()
    )

    # Resolve GPS coordinates if location_id is present but coordinates not provided
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


    # ---------------------------------------------------------
    # 3. Build customer behavioral features
    # ---------------------------------------------------------

    features = build_customer_features(
        current_transaction=(
            current_transaction
        ),
        previous_transactions=(
            previous_transactions
        ),
    )

    # ---------------------------------------------------------
    # 4. Run ML model
    # ---------------------------------------------------------

    ml_prediction = predict_fraud(
        features
    )

    # ---------------------------------------------------------
    # 5. Build GenAI context
    # ---------------------------------------------------------

    genai_context = build_genai_context(
        current_transaction=(
            current_transaction
        ),
        previous_transactions=(
            previous_transactions
        ),
        features=features,
        ml_prediction=ml_prediction,
    )

    # ---------------------------------------------------------
    # 6. GenAI analysis
    # ---------------------------------------------------------

    genai_analysis = analyze_transaction(
        genai_context
    )

    # ---------------------------------------------------------
    # 7. Deterministic final decision
    #
    # The decision engine gets the structured features.
    # Gemini provides explanation, but does not directly
    # control the final decision.
    # ---------------------------------------------------------

    final_decision = make_final_decision(
        ml_prediction=ml_prediction,

        genai_analysis=(
            genai_analysis.model_dump()
        ),

        features=features,
    )

    # ---------------------------------------------------------
    # 8. Return result
    # ---------------------------------------------------------

    return {
        "ml_prediction": ml_prediction,

        "genai_analysis": genai_analysis,

        "final_decision": final_decision,
    }