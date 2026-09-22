const db = require("../config/database");

const saveFraudPrediction = async (transactionId, mlPrediction) => {
    console.log("ML PREDICTION RECEIVED:", mlPrediction);

    const predictionMap = {
        LOW: "LOW_RISK",
        MEDIUM: "MEDIUM_RISK",
        HIGH: "HIGH_RISK",
    };

    const prediction = predictionMap[mlPrediction.risk_level];

    console.log("MAPPED PREDICTION:", prediction);

    if (!prediction) {
        throw new Error(
            `Invalid ML risk level: ${mlPrediction.risk_level}`
        );
    }

    try {
        const [result] = await db.query(
            `INSERT INTO fraud_predictions
            (
                transaction_id,
                model_id,
                fraud_probability,
                risk_score,
                prediction
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                transactionId,
                "trustpay-lightgbm-v1",
                mlPrediction.fraud_probability,
                mlPrediction.risk_score,
                prediction,
            ]
        );

        console.log(
            "FRAUD PREDICTION SAVED:",
            result.insertId
        );

        return result.insertId;

    } catch (error) {
        console.error(
            "SAVE FRAUD PREDICTION ERROR:",
            error
        );

        throw error;
    }
};


const createFraudAlert = async (
    transactionId,
    predictionId,
    finalDecision
) => {
    console.log("CREATING FRAUD ALERT:", {
        transactionId,
        predictionId,
        finalDecision,
    });

    try {
        await db.query(
            `INSERT INTO fraud_alerts
            (
                transaction_id,
                prediction_id,
                severity,
                reason,
                status
            )
            VALUES (?, ?, ?, ?, 'OPEN')`,
            [
                transactionId,
                predictionId,
                finalDecision.final_risk_level,
                finalDecision.reasons.join("; "),
            ]
        );

        console.log("FRAUD ALERT CREATED");

    } catch (error) {
        console.error(
            "CREATE FRAUD ALERT ERROR:",
            error
        );

        throw error;
    }
};


module.exports = {
    saveFraudPrediction,
    createFraudAlert,
};