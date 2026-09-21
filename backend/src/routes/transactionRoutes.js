const express = require("express");

const {
    createTransaction,
    getCustomerTransactions,
} = require("../controllers/transactionController");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

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