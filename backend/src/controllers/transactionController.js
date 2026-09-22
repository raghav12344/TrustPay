const db = require("../config/database");

const {
    analyzeTransaction,
} = require("../services/mlService");

const {
    saveFraudPrediction,
    createFraudAlert,
} = require("../services/fraudService");

const {
    resolveLocation,
} = require("../services/locationService");


// ==========================================================
// CREATE TRANSACTION
// ==========================================================

const createTransaction = async (req, res) => {
    try {
        const userId = req.user.userId;

        /*
         * Device ID comes from the authenticated JWT.
         * It is NOT trusted from req.body.
         */
        const deviceId = req.user.deviceId || null;

        const {
            accountId,
            amount,
            transactionType,
            merchant,
            latitude,
            longitude,
        } = req.body;


        // ==========================================
        // Validate required fields
        // ==========================================

        if (!accountId || !amount || !transactionType) {
            return res.status(400).json({
                success: false,
                message:
                    "Account, amount and transaction type are required",
            });
        }


        // ==========================================
        // Validate amount
        // ==========================================

        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Transaction amount must be greater than zero",
            });
        }


        // ==========================================
        // Validate account ownership
        // ==========================================

        const [accounts] = await db.query(
            `SELECT account_id
             FROM accounts
             WHERE account_id = ?
             AND user_id = ?`,
            [
                accountId,
                userId,
            ]
        );

        if (accounts.length === 0) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this account",
            });
        }


        // ==========================================
        // Validate registered device
        // ==========================================

        if (deviceId) {
            const [devices] = await db.query(
                `SELECT
                    device_id,
                    is_trusted
                 FROM devices
                 WHERE device_id = ?
                 AND user_id = ?`,
                [
                    deviceId,
                    userId,
                ]
            );

            if (devices.length === 0) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Registered device not found",
                });
            }

            /*
             * Update device activity.
             */
            await db.query(
                `UPDATE devices
                 SET last_seen = CURRENT_TIMESTAMP
                 WHERE device_id = ?`,
                [deviceId]
            );
        }


        // ==========================================
        // Resolve location from GPS coordinates
        // ==========================================

        let location = null;
        let locationId = null;

        /*
         * Location is optional because the user
         * may deny browser location permission.
         */
        if (
            latitude !== undefined &&
            latitude !== null &&
            longitude !== undefined &&
            longitude !== null
        ) {
            try {
                location = await resolveLocation(
                    latitude,
                    longitude
                );

                if (location) {
                    locationId = location.locationId;
                }

            } catch (locationError) {
                console.error(
                    "LOCATION RESOLUTION ERROR:",
                    locationError.message
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid location information",
                });
            }
        }


        // ==========================================
        // Create transaction as PENDING
        // ==========================================

        const [result] = await db.query(
            `INSERT INTO transactions
            (
                account_id,
                device_id,
                location_id,
                amount,
                transaction_type,
                merchant,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
            [
                accountId,
                deviceId,
                locationId,
                amount,
                transactionType,
                merchant || null,
            ]
        );

        const transactionId = result.insertId;


        // ==========================================
        // Build transaction for ML service
        // ==========================================

        const transactionTime = new Date();

        const mlTransaction = {
            user_id: userId,

            account_id: accountId,

            amount: Number(amount),

            transaction_type: transactionType,

            merchant: merchant || null,

            transaction_time:
                transactionTime.toISOString(),

            device_id: deviceId,

            location_id: locationId,
        };


        // ==========================================
        // Run AI / ML fraud analysis
        // ==========================================

        let analysis;

        try {
            analysis = await analyzeTransaction(
                mlTransaction
            );

        } catch (mlError) {
            console.error(
                "ML ANALYSIS ERROR:",
                mlError.response?.data ||
                mlError.message
            );

            return res.status(502).json({
                success: false,
                message:
                    "Transaction created but fraud analysis failed. Transaction remains pending.",
                transactionId,
                status: "PENDING",
            });
        }


        // ==========================================
        // Save ML prediction
        // ==========================================

        const predictionId =
            await saveFraudPrediction(
                transactionId,
                analysis.ml_prediction
            );

        // ==========================================
        // HIGH RISK → CREATE FRAUD ALERT
        // ==========================================

        if (
            analysis.final_decision.final_risk_level ===
                "HIGH" &&
            analysis.final_decision.action ===
                "ADMIN_REVIEW"
        ) {
            await createFraudAlert(
                transactionId,
                predictionId,
                analysis.final_decision
            );

            return res.status(201).json({
                success: true,

                message:
                    "Transaction flagged for admin review",

                transactionId,

                status: "PENDING",

                location,

                fraud: analysis,
            });
        }


        // ==========================================
        // LOW / MEDIUM
        // ==========================================

        // ==========================================
// LOW / MEDIUM → APPROVE TRANSACTION
// ==========================================

await db.query(
    `UPDATE transactions
     SET status = 'APPROVED'
     WHERE transaction_id = ?`,
    [transactionId]
);

return res.status(201).json({
    success: true,

    message:
        "Transaction approved successfully",

    transactionId,

    status: "APPROVED",

    location,

    fraud: analysis,
});

    } catch (error) {
        console.error(
            "CREATE TRANSACTION ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create transaction",
        });
    }
};


// ==========================================================
// GET CUSTOMER TRANSACTIONS
// ==========================================================

const getCustomerTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [transactions] = await db.query(
            `SELECT
                t.transaction_id,
                a.account_number,
                t.amount,
                t.transaction_type,
                t.merchant,
                t.transaction_time,
                t.status
             FROM transactions t
             JOIN accounts a
                ON t.account_id = a.account_id
             WHERE a.user_id = ?
             ORDER BY t.transaction_time DESC`,
            [userId]
        );

        res.json({
            success: true,
            transactions,
        });

    } catch (error) {
        console.error(
            "GET TRANSACTIONS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch transactions",
        });
    }
};


// ==========================================================
// GET FRAUD ALERTS - ADMIN
// ==========================================================

const getFraudAlerts = async (req, res) => {
    try {
        const [results] = await db.query(
            "CALL GetSuspiciousTransactions()"
        );

        res.json({
            success: true,
            alerts: results[0],
        });

    } catch (error) {
        console.error(
            "GET FRAUD ALERTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch fraud alerts",
        });
    }
};


// ==========================================================
// APPROVE TRANSACTION - ADMIN
// ==========================================================

const approveTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { reason } = req.body;

        const adminId = req.user.userId;


        // ==========================================
        // Validate transaction ID
        // ==========================================

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Transaction ID is required",
            });
        }


        // ==========================================
        // Validate reason
        // ==========================================

        if (!reason) {
            return res.status(400).json({
                success: false,
                message:
                    "Approval reason is required",
            });
        }


        // ==========================================
        // Execute stored procedure
        // ==========================================

        await db.query(
            "CALL ApproveTransaction(?, ?, ?)",
            [
                transactionId,
                adminId,
                reason,
            ]
        );


        // ==========================================
        // Response
        // ==========================================

        res.json({
            success: true,
            message:
                "Transaction approved successfully",
            transactionId,
            status: "APPROVED",
        });

    } catch (error) {
        console.error(
            "APPROVE TRANSACTION ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to approve transaction",
        });
    }
};


// ==========================================================
// REJECT TRANSACTION - ADMIN
// ==========================================================

const rejectTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { reason } = req.body;

        const adminId = req.user.userId;


        // ==========================================
        // Validate transaction ID
        // ==========================================

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Transaction ID is required",
            });
        }


        // ==========================================
        // Validate reason
        // ==========================================

        if (!reason) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required",
            });
        }


        // ==========================================
        // Execute stored procedure
        // ==========================================

        await db.query(
            "CALL RejectTransaction(?, ?, ?)",
            [
                transactionId,
                adminId,
                reason,
            ]
        );


        // ==========================================
        // Response
        // ==========================================

        res.json({
            success: true,
            message:
                "Transaction rejected successfully",
            transactionId,
            status: "REJECTED",
        });

    } catch (error) {
        console.error(
            "REJECT TRANSACTION ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to reject transaction",
        });
    }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
    createTransaction,
    getCustomerTransactions,
    getFraudAlerts,
    approveTransaction,
    rejectTransaction,
};