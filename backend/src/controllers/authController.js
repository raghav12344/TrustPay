const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

const getClientIp = (req) => {
    const forwarded = req.headers["x-forwarded-for"];

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    return req.socket.remoteAddress || req.ip || null;
};

const detectOS = (userAgent = "") => {
    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/Android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "iOS";
    }

    if (/Mac OS X/i.test(userAgent)) {
        return "macOS";
    }

    if (/Linux/i.test(userAgent)) {
        return "Linux";
    }

    return "Unknown";
};

const detectDeviceType = (userAgent = "") => {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        return "MOBILE";
    }

    return "WEB";
};

const registerDevice = async (
    req,
    userId,
    deviceIdentifier
) => {
    if (!deviceIdentifier) {
        return null;
    }

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);
    const os = detectOS(userAgent);
    const deviceType = detectDeviceType(userAgent);

    const [existingDevices] = await db.query(
        `SELECT
            device_id,
            is_trusted
         FROM devices
         WHERE user_id = ?
         AND device_identifier = ?
         LIMIT 1`,
        [userId, deviceIdentifier]
    );

    if (existingDevices.length > 0) {
        const device = existingDevices[0];

        await db.query(
            `UPDATE devices
             SET
                device_type = ?,
                os = ?,
                ip_address = ?,
                last_seen = CURRENT_TIMESTAMP
             WHERE device_id = ?`,
            [
                deviceType,
                os,
                ipAddress,
                device.device_id,
            ]
        );

        return {
            deviceId: device.device_id,
            isTrusted: Boolean(device.is_trusted),
            isNew: false,
        };
    }

    const [result] = await db.query(
        `INSERT INTO devices
        (
            user_id,
            device_identifier,
            device_type,
            os,
            ip_address,
            is_trusted,
            first_seen,
            last_seen
        )
        VALUES
        (?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
            userId,
            deviceIdentifier,
            deviceType,
            os,
            ipAddress,
        ]
    );

    return {
        deviceId: result.insertId,
        isTrusted: false,
        isNew: true,
    };
};

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
        } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters",
            });
        }

        const [existingUsers] = await db.query(
            `SELECT user_id
             FROM users
             WHERE email = ? OR phone = ?`,
            [email, phone]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Email or phone already registered",
            });
        }

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const [result] = await db.query(
            `INSERT INTO users
            (name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, 'CUSTOMER')`,
            [
                name,
                email,
                phone,
                passwordHash,
            ]
        );

        const userId = result.insertId;

        const accountNumber =
            `TP${String(userId).padStart(10, "0")}`;

        await db.query(
            `INSERT INTO accounts
            (
                user_id,
                account_number,
                account_type,
                balance
            )
            VALUES (?, ?, 'SAVINGS', 0.00)`,
            [
                userId,
                accountNumber,
            ]
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",

            user: {
                userId,
                name,
                email,
                phone,
                role: "CUSTOMER",
            },

            account: {
                accountNumber,
                accountType: "SAVINGS",
                balance: 0.00,
            },
        });

    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};

const login = async (req, res) => {
    try {
        const {
            email,
            password,
            deviceIdentifier,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        const [users] = await db.query(
            `SELECT
                user_id,
                name,
                email,
                phone,
                password_hash,
                role
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const user = users[0];

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const device =
            await registerDevice(
                req,
                user.user_id,
                deviceIdentifier
            );

        /*
         * Device ID is stored inside JWT.
         *
         * This means the transaction API
         * does not need to trust a deviceId
         * sent by the frontend.
         */
        const tokenPayload = {
            userId: user.user_id,
            role: user.role,
        };

        if (device) {
            tokenPayload.deviceId =
                device.deviceId;
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                userId: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },

            device,
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};

module.exports = {
    register,
    login,
};