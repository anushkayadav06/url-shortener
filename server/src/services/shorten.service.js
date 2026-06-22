const { nanoid } = require("nanoid");
const pool = require("../config/db");
const redis = require("../config/redis");

const shortenUrl = async (originalUrl, userId, customAlias, expiresAt) => {

    // Step 1 — already exists for this user?
    const existing = await pool.query(
        `SELECT * FROM urls 
        WHERE original_url = $1 AND user_id = $2`,
        [originalUrl, userId]
    );

    if (existing.rows.length > 0) {
        // return existing instead of creating duplicate
        return { url: existing.rows[0], isNew: false };
    }

    // Step 2 — generate code
    const shortCode = customAlias || nanoid(7);

    // Step 3 — collision check
    const collision = await pool.query(
        `SELECT id FROM urls WHERE short_code = $1`,
        [shortCode]
    );

    if (collision.rows.length > 0) {
        const error = new Error("Alias already taken");
        error.status = 400;
        error.code = "ALIAS_TAKEN";
        throw error;
    }

    // Step 4 — insert to postgres
    const result = await pool.query(
        `INSERT INTO urls 
       (user_id, original_url, short_code, custom_alias, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [userId, originalUrl, shortCode, !!customAlias, expiresAt || null]
    );

    const url = result.rows[0];

    // Step 5 — cache in Redis (TTL 24 hours)
    // key: "url:xK9mP2q"  value: "https://google.com"
    await redis.setex(`url:${shortCode}`, 86400, originalUrl);

    return { url, isNew: true };
};

module.exports = { shortenUrl };