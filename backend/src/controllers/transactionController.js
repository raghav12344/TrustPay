const db = require("../config/database");

const createTransaction = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            accountId,
            deviceId,
            locationId,
            amount,
            transactionType,
            merchant,
        } = req.body;

        // Validate required fields
        if (
            !accountId ||
            !amount ||
            !transactionType
        ) {
            return res.status(400).json({
                success: false,
                message: "Account, amount and transaction type are required",
            });
        }

        // Validate amount
        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Transaction amount must be greater than zero",
            });
        }

        // Make sure the account belongs to the logged-in customer
        const [accounts] = await db.query(
            `SELECT account_id
             FROM accounts
             WHERE account_id = ?
             AND user_id = ?`,
            [accountId, userId]
        );

        if (accounts.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this account",
            });
        }

        // Create transaction
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
                deviceId || null,
                locationId || null,
                amount,
                transactionType,
                merchant || null,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transactionId: result.insertId,
            status: "PENDING",
        });

    } catch (error) {
        console.error("CREATE TRANSACTION ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create transaction",
        });
    }
};


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
        console.error("GET TRANSACTIONS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
        });
    }
};


module.exports = {
    createTransaction,
    getCustomerTransactions,
};