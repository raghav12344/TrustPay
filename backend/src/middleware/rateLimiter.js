const {
    getRedisClient,
    fallbackSlidingWindows,
} = require("../config/redis");

const getClientIdentifier = (req) => {
    if (req.user && req.user.userId) {
        return `user:${req.user.userId}`;
    }

    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress || req.ip || "unknown";

    return `ip:${ip}`;
};

/**
 * Factory for a Redis Sorted-Set (ZSET) Sliding-Window Rate Limiter middleware.
 *
 * @param {Object} options
 * @param {number} options.windowSeconds - Sliding window duration in seconds (default: 10s)
 * @param {number} options.maxRequests - Maximum allowed requests within window (default: 5)
 * @param {string} options.keyPrefix - Redis key namespace prefix
 */
const createSlidingWindowRateLimiter = ({
    windowSeconds = 10,
    maxRequests = 5,
    keyPrefix = "ratelimit:transactions",
} = {}) => {
    const windowMs = windowSeconds * 1000;

    return async (req, res, next) => {
        const identifier = getClientIdentifier(req);
        const redisKey = `${keyPrefix}:${identifier}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            const redisClient = getRedisClient();

            if (redisClient) {
                const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

                // Execute atomic Redis pipeline for sliding window
                const results = await redisClient
                    .multi()
                    .zRemRangeByScore(redisKey, 0, windowStart)
                    .zCard(redisKey)
                    .zAdd(redisKey, [{ score: now, value: member }])
                    .pExpire(redisKey, windowMs)
                    .exec();

                const currentCount = Number(results[1]) || 0;

                res.setHeader("X-RateLimit-Limit", maxRequests);
                res.setHeader(
                    "X-RateLimit-Remaining",
                    Math.max(0, maxRequests - currentCount - 1)
                );
                res.setHeader(
                    "X-RateLimit-Reset",
                    Math.ceil((now + windowMs) / 1000)
                );

                if (currentCount >= maxRequests) {
                    // Remove the rejected request from the sliding window
                    await redisClient.zRem(redisKey, member);
                    res.setHeader("Retry-After", windowSeconds);

                    return res.status(429).json({
                        success: false,
                        message: `Rate limit exceeded: maximum ${maxRequests} requests per ${windowSeconds} seconds allowed.`,
                        retryAfterSeconds: windowSeconds,
                    });
                }

                return next();
            }

            // Fallback in-memory sliding window when Redis broker is offline
            const timestamps = (fallbackSlidingWindows.get(redisKey) || []).filter(
                (ts) => ts > windowStart
            );

            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader(
                "X-RateLimit-Remaining",
                Math.max(0, maxRequests - timestamps.length - 1)
            );
            res.setHeader(
                "X-RateLimit-Reset",
                Math.ceil((now + windowMs) / 1000)
            );

            if (timestamps.length >= maxRequests) {
                fallbackSlidingWindows.set(redisKey, timestamps);
                res.setHeader("Retry-After", windowSeconds);

                return res.status(429).json({
                    success: false,
                    message: `Rate limit exceeded: maximum ${maxRequests} requests per ${windowSeconds} seconds allowed.`,
                    retryAfterSeconds: windowSeconds,
                });
            }

            timestamps.push(now);
            fallbackSlidingWindows.set(redisKey, timestamps);
            return next();
        } catch (error) {
            console.error("[RATE LIMITER] Error evaluating sliding window:", error.message);
            // Fail open so legitimate banking traffic is not blocked by cache errors
            return next();
        }
    };
};

// Default instance for /api/transactions: max 5 requests per 10 seconds per userId/IP
const transactionRateLimiter = createSlidingWindowRateLimiter({
    windowSeconds: 10,
    maxRequests: 5,
    keyPrefix: "ratelimit:transactions",
});

module.exports = {
    createSlidingWindowRateLimiter,
    transactionRateLimiter,
};
