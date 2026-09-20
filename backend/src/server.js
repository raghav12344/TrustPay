const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { URL } = require("url");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const databaseUrl = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.substring(1),

    ssl: {
        rejectUnauthorized: false
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
async function testDatabase() {
    try {
        const connection = await pool.getConnection();

        console.log("MySQL connected successfully!");

        connection.release();
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);
    }
}

testDatabase();

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            success: true,
            message: "TrustPay backend is running",
            database: "connected"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`TrustPay API running on port ${PORT}`);
});