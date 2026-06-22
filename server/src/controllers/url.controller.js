const validator = require("validator");
const { shortenUrl } = require("../services/shorten.service");
const { resolveUrl, logClick } = require("../services/redirect.service");
const { rateLimitShorten } = require("../services/ratelimit.service");

const createShortUrl = async (req, res, next) => {
    try {
        const { originalUrl, customAlias, expiresAt } = req.body;
        const userId = req.user.id;

        // Step 1 — validate
        if (!originalUrl) {
            return res.status(400).json({ message: "URL is required" });
        }

        if (!validator.isURL(originalUrl, { require_protocol: true })) {
            return res.status(400).json({ message: "Invalid URL. Include https://" });
        }

        // Step 2 — rate limit
        await rateLimitShorten(userId);

        // Step 3 — shorten
        const { url, isNew } = await shortenUrl(
            originalUrl,
            userId,
            customAlias,
            expiresAt
        );

        // Step 4 — respond
        return res.status(isNew ? 201 : 200).json({
            success: true,
            isNew,
            shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
            data: url,
        });

    } catch (err) {
        // pass structured errors to error middleware
        next(err);
    }
};

const redirectUrl = async (req, res, next) => {
    try {
        const { shortCode } = req.params;

        // Step 1 — resolve URL (Redis first, then DB)
        const originalUrl = await resolveUrl(shortCode);

        // Step 2 — parse headers
        const ua = req.headers["user-agent"] || "";
        const device = /mobile/i.test(ua) ? "mobile" : "desktop";
        const referrer = req.headers["referer"] || "direct";

        // Step 3 — redirect immediately
        res.redirect(301, originalUrl);

        // Step 4 — log click AFTER redirect
        // user is already gone, this runs in background
        logClick(shortCode, { device, referrer });

    } catch (err) {
        next(err);
    }
};

const getUserUrls = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT id, original_url, short_code, custom_alias, expires_at, created_at
        FROM urls WHERE user_id = $1
        ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });

    } catch (err) {
        next(err);
    }
};

const deleteUrl = async (req, res, next) => {
    try {
        const { shortCode } = req.params;
        const userId = req.user.id;

        // make sure user owns this URL
        const result = await pool.query(
            `DELETE FROM urls 
       WHERE short_code = $1 AND user_id = $2
       RETURNING id`,
            [shortCode, userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "URL not found or not yours" });
        }

        // remove from Redis cache too
        await redis.del(`url:${shortCode}`);

        return res.status(200).json({ success: true, message: "URL deleted" });

    } catch (err) {
        next(err);
    }
};

module.exports = { createShortUrl, redirectUrl, getUserUrls, deleteUrl };