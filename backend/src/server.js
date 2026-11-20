const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");

const app = express();
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const accountRoutes = require("./routes/accountRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/accounts", accountRoutes);
// ==========================================
// Omnichannel Health Check & Keep-Alive
// ==========================================

const axios = require("axios");
const { initRabbitMQ, pingRabbitMQ } = require("./services/queueService");
const { initRedis, pingRedis } = require("./config/redis");

app.get("/api/health", async (req, res) => {
    const [dbOk, redisStatus, rmqOk] = await Promise.all([
        db
            .query("SELECT 1")
            .then(() => "connected")
            .catch(() => "reconnecting"),
        pingRedis(),
        pingRabbitMQ(),
    ]);

    res.json({
        success: true,
        message: "TrustPay backend is running",
        services: {
            database: dbOk,
            redis: redisStatus,
            rabbitmq: rmqOk ? "connected" : "fallback",
        },
    });
});


// ==========================================
// Database Test
// ==========================================

app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 1 AS connected"
        );

        res.json({
            success: true,
            database: rows[0].connected === 1,
            message: "Aiven MySQL connected successfully",
        });

    } catch (error) {
        console.error("DATABASE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message,
        });
    }
});


// ==========================================
// Server & 6-Service Keep-Alive Daemon
// ==========================================

const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const PUBLIC_BACKEND_URL =
    process.env.RENDER_EXTERNAL_URL ||
    "https://trustpay-backend-service.onrender.com";

const runOmnichannelKeepAlive = async () => {
    try {
        await Promise.allSettled([
            db.query("SELECT 1"),
            pingRedis(),
            pingRabbitMQ(),
            axios.get(`${ML_SERVICE_URL}/`, { timeout: 15000 }),
            axios.get(`${PUBLIC_BACKEND_URL}/api/health`, { timeout: 15000 }),
        ]);
    } catch {
        // Ignore transient network errors during keep-alive
    }
};

const server = app.listen(PORT, () => {
    console.log(`TrustPay API running on port ${PORT}`);
    initRabbitMQ().catch((err) => {
        console.warn("[RABBITMQ] Initial connect warning:", err.message);
    });
    initRedis().catch((err) => {
        console.warn("[REDIS] Initial connect warning:", err.message);
    });

    // Ping all 6 services every 10 minutes so Render, Aiven MySQL,
    // Render Redis, and CloudAMQP RabbitMQ never spin down due to inactivity
    const keepAliveTimer = setInterval(runOmnichannelKeepAlive, 10 * 60 * 1000);
    if (keepAliveTimer.unref) {
        keepAliveTimer.unref();
    }
});

process.on("SIGTERM", () => {
    console.log("[SERVER] SIGTERM received during rolling deploy — shutting down old instance cleanly.");
    server.close(() => {
        process.exit(0);
    });
});
