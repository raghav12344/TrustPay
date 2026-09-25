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
        // Validate account ownership & balance
        // ==========================================

        const [accounts] = await db.query(
            `SELECT account_id, balance
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

        const currentAccount = accounts[0];
        if (
            transactionType !== "DEPOSIT" &&
            Number(currentAccount.balance) < Number(amount)
        ) {
            return res.status(400).json({
                success: false,
                message: `Insufficient account balance. Available balance: ₹${Number(currentAccount.balance).toFixed(2)}`,
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

// Update account balance
if (transactionType === "DEPOSIT") {
    await db.query(
        `UPDATE accounts
         SET balance = balance + ?
         WHERE account_id = ?`,
        [amount, accountId]
    );
} else {
    await db.query(
        `UPDATE accounts
         SET balance = balance - ?
         WHERE account_id = ?`,
        [amount, accountId]
    );
}

const [refreshedAccounts] = await db.query(
    `SELECT balance FROM accounts WHERE account_id = ?`,
    [accountId]
);
const newBalance = refreshedAccounts.length > 0 ? Number(refreshedAccounts[0].balance) : null;

return res.status(201).json({
    success: true,
    message: "Transaction approved successfully",
    transactionId,
    status: "APPROVED",
    newBalance,
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

        // Update account balance based on transaction details
        const [txInfo] = await db.query(
            `SELECT account_id, amount, transaction_type
             FROM transactions
             WHERE transaction_id = ?`,
            [transactionId]
        );

        let newBalance = null;
        if (txInfo.length > 0) {
            const { account_id, amount: txAmount, transaction_type } = txInfo[0];
            if (transaction_type === "DEPOSIT") {
                await db.query(
                    `UPDATE accounts
                     SET balance = balance + ?
                     WHERE account_id = ?`,
                    [txAmount, account_id]
                );
            } else {
                await db.query(
                    `UPDATE accounts
                     SET balance = balance - ?
                     WHERE account_id = ?`,
                    [txAmount, account_id]
                );
            }

            const [accBalance] = await db.query(
                `SELECT balance FROM accounts WHERE account_id = ?`,
                [account_id]
            );
            if (accBalance.length > 0) {
                newBalance = Number(accBalance[0].balance);
            }
        }

        // ==========================================
        // Response
        // ==========================================

        res.json({
            success: true,
            message:
                "Transaction approved successfully",
            transactionId,
            status: "APPROVED",
            newBalance,
        });

    } catch (error) {
        console.error(
            "APPROVE TRANSACTION ERROR:",
            error
        );

        /*
         * The stored procedure SIGNALs SQLSTATE '45000'
         * for "not found" / "already resolved" cases.
         * Surface those as 409 instead of a generic 500.
         */
        if (error.sqlState === "45000") {
            return res.status(409).json({
                success: false,
                message: error.sqlMessage,
            });
        }

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

        if (error.sqlState === "45000") {
            return res.status(409).json({
                success: false,
                message: error.sqlMessage,
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Failed to reject transaction",
        });
    }
};


// ==========================================================
// GET ALL TRANSACTIONS - ADMIN
// ==========================================================

const getAllTransactionsAdmin = async (req, res) => {
    try {
        const {
            customerId,
            userId,
            accountId,
            status,
            category,
            search,
            limit = 500,
        } = req.query;

        let query = `
            SELECT
                t.transaction_id,
                t.account_id,
                a.account_number,
                a.account_type,
                a.balance AS current_account_balance,
                u.user_id,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                t.amount,
                t.transaction_type,
                t.merchant,
                t.status,
                t.transaction_time,
                t.created_at,
                loc.city,
                loc.state,
                loc.country,
                d.device_type,
                d.os,
                d.ip_address,
                d.is_trusted,
                fp.risk_score,
                fp.fraud_probability,
                fp.prediction AS risk_level,
                fp.predicted_at,
                fa.alert_id,
                fa.severity AS alert_severity,
                fa.status AS alert_status,
                fa.reason AS alert_reason,
                ar.review_id,
                ar.decision AS review_decision,
                ar.reason AS review_reason,
                ar.reviewed_at,
                reviewer.name AS reviewed_by_name
            FROM transactions t
            JOIN accounts a ON t.account_id = a.account_id
            JOIN users u ON a.user_id = u.user_id
            LEFT JOIN locations loc ON t.location_id = loc.location_id
            LEFT JOIN devices d ON t.device_id = d.device_id
            LEFT JOIN (
                SELECT fp1.*
                FROM fraud_predictions fp1
                INNER JOIN (
                    SELECT transaction_id, MAX(prediction_id) AS max_p_id
                    FROM fraud_predictions
                    GROUP BY transaction_id
                ) fp_max ON fp1.prediction_id = fp_max.max_p_id
            ) fp ON t.transaction_id = fp.transaction_id
            LEFT JOIN (
                SELECT fa1.*
                FROM fraud_alerts fa1
                INNER JOIN (
                    SELECT transaction_id, MAX(alert_id) AS max_a_id
                    FROM fraud_alerts
                    GROUP BY transaction_id
                ) fa_max ON fa1.alert_id = fa_max.max_a_id
            ) fa ON t.transaction_id = fa.transaction_id
            LEFT JOIN (
                SELECT ar1.*
                FROM admin_reviews ar1
                INNER JOIN (
                    SELECT transaction_id, MAX(review_id) AS max_r_id
                    FROM admin_reviews
                    GROUP BY transaction_id
                ) ar_max ON ar1.review_id = ar_max.max_r_id
            ) ar ON t.transaction_id = ar.transaction_id
            LEFT JOIN users reviewer ON ar.admin_id = reviewer.user_id
            WHERE 1=1
        `;

        const queryParams = [];

        // Customer ID / User ID filter
        const targetUserId = customerId || userId;
        if (targetUserId) {
            query += ` AND u.user_id = ?`;
            queryParams.push(targetUserId);
        }

        // Account ID filter
        if (accountId) {
            query += ` AND a.account_id = ?`;
            queryParams.push(accountId);
        }

        // Status filter
        if (status && status !== "ALL") {
            query += ` AND t.status = ?`;
            queryParams.push(status.toUpperCase());
        }

        // Category filter
        if (category && category !== "ALL") {
            const cat = category.toUpperCase();
            if (cat === "PASSED") {
                query += ` AND t.status = 'APPROVED'`;
            } else if (cat === "REVIEWED") {
                query += ` AND ar.review_id IS NOT NULL`;
            } else if (cat === "PENDING_ERROR") {
                query += ` AND t.status = 'PENDING' AND fa.alert_id IS NULL AND ar.review_id IS NULL`;
            } else if (cat === "PENDING_ALERT") {
                query += ` AND t.status = 'PENDING' AND fa.alert_id IS NOT NULL`;
            } else if (cat === "REJECTED") {
                query += ` AND t.status = 'REJECTED'`;
            }
        }

        // Search filter
        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            query += ` AND (
                t.transaction_id LIKE ? OR
                u.name LIKE ? OR
                u.email LIKE ? OR
                u.phone LIKE ? OR
                a.account_number LIKE ? OR
                t.merchant LIKE ?
            )`;
            queryParams.push(
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm
            );
        }

        query += ` ORDER BY t.transaction_time DESC LIMIT ?`;
        queryParams.push(Number(limit) || 500);

        const [rows] = await db.query(query, queryParams);

        // Format and compute diagnostic information
        const transactions = rows.map((row) => {
            let diagnosisCode = "UNKNOWN";
            let diagnosisTitle = "Normal Transaction";
            let diagnosisBadge = "badge-neutral";
            let diagnosisDescription = "Transaction recorded in ledger.";

            if (row.status === "APPROVED") {
                if (row.review_id) {
                    diagnosisCode = "REVIEWED_APPROVED";
                    diagnosisTitle = "Passed via Admin Review";
                    diagnosisBadge = "badge-success";
                    diagnosisDescription = row.review_reason
                        ? `Approved by ${row.reviewed_by_name || "Admin"}: "${row.review_reason}"`
                        : "Approved after manual administrative review.";
                } else {
                    diagnosisCode = "PASSED_AUTO";
                    diagnosisTitle = "Passed Automated Clearance";
                    diagnosisBadge = "badge-success";
                    diagnosisDescription = row.transaction_type === "DEPOSIT"
                        ? "Credit deposit cleared into account."
                        : "Low/Medium risk anomaly score. Cleared automatically by Sentinel AI.";
                }
            } else if (row.status === "REJECTED") {
                if (row.review_id) {
                    diagnosisCode = "REVIEWED_REJECTED";
                    diagnosisTitle = "Rejected by Admin";
                    diagnosisBadge = "badge-danger";
                    diagnosisDescription = row.review_reason
                        ? `Rejected by ${row.reviewed_by_name || "Admin"}: "${row.review_reason}"`
                        : "Rejected during manual compliance review.";
                } else {
                    diagnosisCode = "REJECTED";
                    diagnosisTitle = "Rejected Transaction";
                    diagnosisBadge = "badge-danger";
                    diagnosisDescription = "Transaction rejected by fraud detection rules.";
                }
            } else if (row.status === "PENDING") {
                if (row.alert_id) {
                    diagnosisCode = "PENDING_ALERT";
                    diagnosisTitle = "Pending: Security Alert Review";
                    diagnosisBadge = "badge-warning";
                    diagnosisDescription = row.alert_reason || "Flagged high-risk anomaly by Sentinel AI. Awaiting admin review.";
                } else {
                    diagnosisCode = "PENDING_ERROR";
                    diagnosisTitle = "Pending: Analysis Error / Service Hold";
                    diagnosisBadge = "badge-error";
                    diagnosisDescription = "Fraud analysis service failed or timed out during processing. Transaction safely held in pending state until administrative action.";
                }
            }

            return {
                transactionId: row.transaction_id,
                transaction_id: row.transaction_id,
                accountId: row.account_id,
                accountNumber: row.account_number,
                accountType: row.account_type,
                currentAccountBalance: Number(row.current_account_balance),
                userId: row.user_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                amount: Number(row.amount),
                transactionType: row.transaction_type,
                transaction_type: row.transaction_type,
                merchant: row.merchant,
                status: row.status,
                transactionTime: row.transaction_time,
                transaction_time: row.transaction_time,
                createdAt: row.created_at,
                location: row.city ? {
                    city: row.city,
                    state: row.state,
                    country: row.country,
                } : null,
                device: row.device_type ? {
                    deviceType: row.device_type,
                    os: row.os,
                    ipAddress: row.ip_address,
                    isTrusted: Boolean(row.is_trusted),
                } : null,
                fraudPrediction: row.risk_score != null ? {
                    riskScore: Number(row.risk_score),
                    fraudProbability: Number(row.fraud_probability),
                    riskLevel: row.risk_level,
                    predictedAt: row.predicted_at,
                } : null,
                fraudAlert: row.alert_id != null ? {
                    alertId: row.alert_id,
                    severity: row.alert_severity,
                    status: row.alert_status,
                    reason: row.alert_reason,
                } : null,
                review: row.review_id != null ? {
                    reviewId: row.review_id,
                    decision: row.review_decision,
                    reason: row.review_reason,
                    reviewedAt: row.reviewed_at,
                    reviewedBy: row.reviewed_by_name,
                } : null,
                diagnosis: {
                    code: diagnosisCode,
                    badge: diagnosisBadge,
                    title: diagnosisTitle,
                    description: diagnosisDescription,
                },
            };
        });

        // Compute summary counts
        const stats = {
            totalCount: transactions.length,
            totalVolume: transactions.reduce((acc, tx) => acc + tx.amount, 0),
            passedCount: transactions.filter((tx) => tx.status === "APPROVED").length,
            reviewedCount: transactions.filter((tx) => tx.review !== null).length,
            pendingCount: transactions.filter((tx) => tx.status === "PENDING").length,
            pendingErrorCount: transactions.filter((tx) => tx.diagnosis.code === "PENDING_ERROR").length,
            pendingAlertCount: transactions.filter((tx) => tx.diagnosis.code === "PENDING_ALERT").length,
            rejectedCount: transactions.filter((tx) => tx.status === "REJECTED").length,
        };

        res.json({
            success: true,
            transactions,
            stats,
        });

    } catch (error) {
        console.error("GET ALL TRANSACTIONS ADMIN ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
            error: error.message,
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
    getAllTransactionsAdmin,
    approveTransaction,
    rejectTransaction,
};