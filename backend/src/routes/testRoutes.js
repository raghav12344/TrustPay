const express = require("express");

const {
    authenticate,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticate, (req, res) => {
    res.json({
        success: true,
        message: "Authenticated successfully",
        user: req.user,
    });
});

router.get(
    "/customer",
    authenticate,
    authorize("CUSTOMER"),
    (req, res) => {
        res.json({
            success: true,
            message: "Customer route accessed",
            user: req.user,
        });
    }
);

router.get(
    "/admin",
    authenticate,
    authorize("ADMIN"),
    (req, res) => {
        res.json({
            success: true,
            message: "Admin route accessed",
            user: req.user,
        });
    }
);

module.exports = router;