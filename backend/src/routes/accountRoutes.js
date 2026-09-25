const express = require("express");

const {
    getMyAccount,
    getAllAccounts,
    adminDeposit,
} = require("../controllers/accountController");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Customer route
router.get(
    "/me",
    authenticate,
    authorize("CUSTOMER"),
    getMyAccount
);

// Admin routes
router.get(
    "/admin/all",
    authenticate,
    authorize("ADMIN"),
    getAllAccounts
);

router.post(
    "/admin/deposit",
    authenticate,
    authorize("ADMIN"),
    adminDeposit
);

module.exports = router;
