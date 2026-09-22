const express = require("express");

const {
    createTransaction,
    getCustomerTransactions,
    getFraudAlerts,
    approveTransaction,
    rejectTransaction,
} = require("../controllers/transactionController");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.post(
    "/admin/transactions/:transactionId/reject",
    authenticate,
    authorize("ADMIN"),
    rejectTransaction
);
router.post(
    "/admin/transactions/:transactionId/approve",
    authenticate,
    authorize("ADMIN"),
    approveTransaction
);
router.get(
    "/admin/fraud-alerts",
    authenticate,
    authorize("ADMIN"),
    getFraudAlerts
);
router.post(
    "/",
    authenticate,
    authorize("CUSTOMER"),
    createTransaction
);

router.get(
    "/",
    authenticate,
    authorize("CUSTOMER"),
    getCustomerTransactions
);

module.exports = router;