const mysql = require("mysql2/promise");
const { URL } = require("url");

const databaseUrl = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
    host: databaseUrl.hostname,
    port: databaseUrl.port,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.substring(1),

    ssl: {
        rejectUnauthorized: false,
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;