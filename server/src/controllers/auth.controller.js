const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// helper — generate JWT
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const register = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // basic validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password min 6 characters" });
        }

        // Step 1 — email already registered?
        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Step 2 — hash password
        // 10 = salt rounds (cost factor)
        const passwordHash = await bcrypt.hash(password, 10);

        // Step 3 — insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
            [email, passwordHash]
        );

        const user = result.rows[0];

        // Step 4 — return token
        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });

    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Step 1 — find user
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        if (!result.rows.length) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Step 2 — compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Step 3 — return token
        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });

    } catch (err) {
        next(err);
    }
};

// get current logged in user
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user, // comes from auth middleware
    });
};

module.exports = { register, login, getMe };