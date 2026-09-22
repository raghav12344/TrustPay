const express = require("express");
const axios = require("axios");

const router = express.Router();
router.get("/ml-test", async (req, res) => {
    try {
        const response = await axios.get(
            `${process.env.ML_SERVICE_URL}/`
        );

        res.json({
            success: true,
            message: "Node successfully connected to ML service",
            mlService: response.data,
        });
    } catch (error) {
        console.error(
            "ML SERVICE TEST ERROR:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Could not connect to ML service",
            error: error.response?.data || error.message,
        });
    }
});

module.exports = router;