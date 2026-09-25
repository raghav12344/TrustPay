const db = require("../config/database");

// ==========================================================
// GET MY ACCOUNT - CUSTOMER
// ==========================================================

const getMyAccount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [accounts] = await db.query(
            `SELECT
                account_id,
                account_number,
                account_type,
                balance,
                created_at
             FROM accounts
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No account found for this user",
            });
        }

        const account = accounts[0];

        res.json({
            success: true,
            account: {
                accountId: account.account_id,
                accountNumber: account.account_number,
                accountType: account.account_type,
                balance: Number(account.balance),
                createdAt: account.created_at,
            },
        });

    } catch (error) {
        console.error(
            "GET ACCOUNT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch account",
        });
    }
};


// ==========================================================
// GET ALL ACCOUNTS - ADMIN
// ==========================================================

const getAllAccounts = async (req, res) => {
    try {
        const [accounts] = await db.query(
            `SELECT
                a.account_id,
                a.account_number,
                a.account_type,
                a.balance,
                a.created_at,
                u.user_id,
                u.name AS customer_name,
                u.email,
                u.phone
             FROM accounts a
             JOIN users u ON a.user_id = u.user_id
             ORDER BY a.created_at DESC`
        );

        res.json({
            success: true,
            accounts: accounts.map((acc) => ({
                accountId: acc.account_id,
                accountNumber: acc.account_number,
                accountType: acc.account_type,
                balance: Number(acc.balance),
                createdAt: acc.created_at,
                userId: acc.user_id,
                customerName: acc.customer_name,
                email: acc.email,
                phone: acc.phone,
            })),
        });

    } catch (error) {
        console.error("GET ALL ACCOUNTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch accounts",
        });
    }
};


// ==========================================================
// ADMIN DEPOSIT / CREDIT ACCOUNT
// ==========================================================

const adminDeposit = async (req, res) => {
    try {
        const { accountId, amount, remarks } = req.body;

        if (!accountId || !amount) {
            return res.status(400).json({
                success: false,
                message: "Account ID and amount are required",
            });
        }

        const depositAmount = Number(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Deposit amount must be greater than zero",
            });
        }

        // Verify account exists
        const [accounts] = await db.query(
            `SELECT account_id, balance, account_number
             FROM accounts
             WHERE account_id = ?`,
            [accountId]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        const currentAccount = accounts[0];
        const newBalance = Number(currentAccount.balance) + depositAmount;

        // Update balance in accounts table
        await db.query(
            `UPDATE accounts
             SET balance = ?
             WHERE account_id = ?`,
            [newBalance, accountId]
        );

        // Record approved DEPOSIT transaction in transactions table
        const [txResult] = await db.query(
            `INSERT INTO transactions
            (
                account_id,
                amount,
                transaction_type,
                merchant,
                status
            )
            VALUES (?, ?, 'DEPOSIT', ?, 'APPROVED')`,
            [
                accountId,
                depositAmount,
                remarks ? `Admin Credit: ${remarks}` : "Admin Credit Deposit",
            ]
        );

        res.json({
            success: true,
            message: `Successfully credited ${depositAmount} to account ${currentAccount.account_number}`,
            accountId,
            accountNumber: currentAccount.account_number,
            creditedAmount: depositAmount,
            newBalance,
            transactionId: txResult.insertId,
        });

    } catch (error) {
        console.error("ADMIN DEPOSIT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to credit account",
            error: error.message,
        });
    }
};

module.exports = {
    getMyAccount,
    getAllAccounts,
    adminDeposit,
};
