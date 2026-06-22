const pool = require("../config/db");
const redis = require("../config/redis");

const resolveUrl = async (shortCode) => {

    // Step 1 — Redis first (sub 1ms)
    const cached = await redis.get(`url:${shortCode}`);

    if (cached) {
        console.log(`Cache HIT for ${shortCode}`);
        return cached;
    }

    console.log(`Cache MISS for ${shortCode} — hitting DB`);

    // Step 2 — fallback to Postgres
    const result = await pool.query(
        `SELECT original_url, expires_at 
        FROM urls WHERE short_code = $1`,
        [shortCode]
    );

    if (!result.rows.length) {
        const error = new Error("Short URL not found");
        error.status = 404;
        throw error;
    }

    const { original_url, expires_at } = result.rows[0];

    // Step 3 — check expiry
    if (expires_at && new Date(expires_at) < new Date()) {
        const error = new Error("This link has expired");
        error.status = 410; // 410 Gone — more accurate than 404
        throw error;
    }

    // Step 4 — re-cache for next time
    await redis.setex(`url:${shortCode}`, 86400, original_url);

    return original_url;
};

// runs AFTER redirect — user never waits for this
const logClick = async (shortCode, { device, referrer }) => {
    try {
        // get url id
        const urlResult = await pool.query(
            `SELECT id FROM urls WHERE short_code = $1`,
            [shortCode]
        );

        if (!urlResult.rows.length) return;

        const urlId = urlResult.rows[0].id;

        // insert click record
        await pool.query(
            `INSERT INTO clicks (url_id, device, referrer)
        VALUES ($1, $2, $3)`,
            [urlId, device, referrer]
        );

    } catch (err) {
        // never crash the app over a failed click log
        console.error("Click log failed silently:", err.message);
    }
};

module.exports = { resolveUrl, logClick };