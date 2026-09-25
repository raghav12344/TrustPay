const express = require("express");

const {
    getMyAccount,
} = require("../controllers/accountController");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/me",
    authenticate,
    authorize("CUSTOMER"),
    getMyAccount
);

module.exports = router;
