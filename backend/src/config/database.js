const mysql = require("mysql2/promise");
const { URL } = require("url");

const databaseUrl = new URL(
    process.env.DATABASE_URL || "mysql://root:trustpay_root_pass@localhost:3306/trustpay"
);

const sslConfig =
    process.env.DB_SSL === "false"
        ? undefined
        : {
              rejectUnauthorized: false,
          };

const pool = mysql.createPool({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port) || 3306,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.substring(1),

    ssl: sslConfig,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
});

// Periodic lightweight heartbeat (every 4 minutes) to prevent Aiven Cloud MySQL
// free-tier instances from powering off due to connection inactivity.
const heartbeatInterval = setInterval(async () => {
    try {
        await pool.query("SELECT 1");
    } catch (err) {
        console.warn("[DB HEARTBEAT] Ping warning:", err.message);
    }
}, 4 * 60 * 1000);

if (heartbeatInterval.unref) {
    heartbeatInterval.unref();
}

module.exports = pool;