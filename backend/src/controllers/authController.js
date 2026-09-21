const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

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
                message: "Password must be at least 6 characters",
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
                message: "Email or phone already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users
            (name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, 'CUSTOMER')`,
            [name, email, phone, passwordHash]
        );

        const userId = result.insertId;

        const accountNumber =
            `TP${String(userId).padStart(10, "0")}`;

        await db.query(
            `INSERT INTO accounts
            (user_id, account_number, account_type, balance)
            VALUES (?, ?, 'SAVINGS', 0.00)`,
            [userId, accountNumber]
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
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
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
                message: "Invalid email or password",
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
            },
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
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

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