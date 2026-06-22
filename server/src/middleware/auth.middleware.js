const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT id, email, created_at FROM users WHERE id = $1`,
            [decoded.id]
        );

        if (!result.rows.length) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        req.user = result.rows[0];

        next();

    } catch (err) {
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        next(err);
    }
};

module.exports = { protect };