const redis = require("../config/redis");

const rateLimitShorten = async (userId) => {
    const key = `ratelimit:shorten:${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const max = 10;              // max 10 shortens per minute

    // Step 1 — remove timestamps older than 1 minute
    // zremrangebyscore removes members with score between 0 and (now - 60000)
    await redis.zremrangebyscore(key, 0, now - windowMs);

    // Step 2 — count how many requests in last 60 seconds
    const count = await redis.zcard(key);

    // Step 3 — over limit?
    if (count >= max) {
        const error = new Error("Too many requests. Max 10 per minute.");
        error.status = 429;
        error.code = "RATE_LIMIT_EXCEEDED";
        throw error;
    }

    // Step 4 — add current request timestamp
    // zadd key score member
    await redis.zadd(key, now, `${now}`);

    // reset expiry so key cleans itself up
    await redis.expire(key, 60);
};

module.exports = { rateLimitShorten };