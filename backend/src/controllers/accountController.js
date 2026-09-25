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

module.exports = {
    getMyAccount,
};
