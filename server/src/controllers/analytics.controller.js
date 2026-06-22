const pool = require("../config/db");

const getAnalytics = async (req, res, next) => {
    try {
        const { shortCode } = req.params;
        const userId = req.user.id;

        // Step 1 — verify ownership
        const urlResult = await pool.query(
            `SELECT * FROM urls 
        WHERE short_code = $1 AND user_id = $2`,
            [shortCode, userId]
        );

        if (!urlResult.rows.length) {
            return res.status(404).json({ message: "URL not found" });
        }

        const urlId = urlResult.rows[0].id;

        // Step 2 — run all queries in PARALLEL
        // Promise.all fires all 4 at same time instead of one by one
        const [total, byDevice, byDay, byReferrer] = await Promise.all([

            // total clicks
            pool.query(
                `SELECT COUNT(*) as count FROM clicks WHERE url_id = $1`,
                [urlId]
            ),

            // clicks by device
            pool.query(
                `SELECT device, COUNT(*) as count
            FROM clicks WHERE url_id = $1
            GROUP BY device`,
                [urlId]
            ),

            // clicks per day — last 7 days
            pool.query(
                `SELECT DATE(clicked_at) as date, COUNT(*) as count
                FROM clicks
                WHERE url_id = $1
                AND clicked_at > NOW() - INTERVAL '7 days'
                GROUP BY DATE(clicked_at)
                ORDER BY date ASC`,
                [urlId]
            ),

            // top 5 referrers
            pool.query(
                `SELECT referrer, COUNT(*) as count
                FROM clicks WHERE url_id = $1
                GROUP BY referrer
                ORDER BY count DESC
                LIMIT 5`,
                [urlId]
            ),
        ]);

        // Step 3 — return
        return res.status(200).json({
            success: true,
            url: {
                shortCode: urlResult.rows[0].short_code,
                originalUrl: urlResult.rows[0].original_url,
                createdAt: urlResult.rows[0].created_at,
                expiresAt: urlResult.rows[0].expires_at,
            },
            analytics: {
                totalClicks: parseInt(total.rows[0].count),
                byDevice: byDevice.rows,
                clicksLast7Days: byDay.rows,
                topReferrers: byReferrer.rows,
            },
        });

    } catch (err) {
        next(err);
    }
};

module.exports = { getAnalytics };