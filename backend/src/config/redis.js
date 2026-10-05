const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient = null;
let isRedisReady = false;
let isConnecting = false;

// In-memory fallback stores when Redis server is unreachable in standalone dev
const fallbackCache = new Map();
const fallbackSlidingWindows = new Map();

/**
 * Initializes the Redis v4 client and establishes connection.
 */
const initRedis = async () => {
    if (redisClient && isRedisReady) {
        return redisClient;
    }

    if (isConnecting) {
        return redisClient;
    }

    isConnecting = true;

    try {
        redisClient = createClient({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        return new Error("Redis max reconnection attempts reached");
                    }
                    return Math.min(retries * 1000, 5000);
                },
            },
        });

        redisClient.on("error", (err) => {
            if (isRedisReady) {
                console.warn("[REDIS] Client error:", err.message);
            }
            isRedisReady = false;
        });

        redisClient.on("ready", () => {
            isRedisReady = true;
            console.log(`[REDIS] Connected and ready at ${REDIS_URL}`);
        });

        redisClient.on("end", () => {
            isRedisReady = false;
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.warn(
            `[REDIS] Could not connect to ${REDIS_URL} (${error.message}). Operating with in-memory fallback.`
        );
        isRedisReady = false;
        return null;
    } finally {
        isConnecting = false;
    }
};

const getRedisClient = () => (isRedisReady ? redisClient : null);

/**
 * Retrieves a JSON-parsed value from Redis cache (or fallback memory cache).
 *
 * @param {string} key - Cache key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
    try {
        if (isRedisReady && redisClient) {
            const raw = await redisClient.get(key);
            return raw ? JSON.parse(raw) : null;
        }

        // In-memory fallback
        const entry = fallbackCache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            fallbackCache.delete(key);
            return null;
        }
        return entry.value;
    } catch (err) {
        console.warn(`[REDIS] getCache error for key '${key}':`, err.message);
        return null;
    }
};

/**
 * Stores a JSON-serialized value in Redis with an expiration TTL in seconds.
 *
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
const setCache = async (key, value, ttlSeconds = 60) => {
    try {
        if (isRedisReady && redisClient) {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
            return true;
        }

        // In-memory fallback
        fallbackCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return true;
    } catch (err) {
        console.warn(`[REDIS] setCache error for key '${key}':`, err.message);
        return false;
    }
};

/**
 * Deletes one or more keys from Redis cache (and fallback memory cache).
 *
 * @param {string} key - Cache key to invalidate
 */
const deleteCache = async (key) => {
    try {
        fallbackCache.delete(key);
        if (isRedisReady && redisClient) {
            await redisClient.del(key);
        }
    } catch (err) {
        console.warn(`[REDIS] deleteCache error for key '${key}':`, err.message);
    }
};

/**
 * Lightweight keep-alive ping for Redis (or fallback memory store).
 */
const pingRedis = async () => {
    try {
        if (isRedisReady && redisClient) {
            await redisClient.ping();
            return "connected";
        }
        return "in-memory-fallback";
    } catch {
        return "in-memory-fallback";
    }
};

module.exports = {
    REDIS_URL,
    initRedis,
    getRedisClient,
    getCache,
    setCache,
    deleteCache,
    pingRedis,
    fallbackSlidingWindows,
};

