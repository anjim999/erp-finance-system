// Redis Caching Utility for Vyapar360 Gateway
// Uses Upstash Redis (serverless-friendly)

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ============================================
// CACHE UTILITY FUNCTIONS
// ============================================

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
export const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        if (data) {
            console.log(`[CACHE] HIT: ${key}`);
            return data;
        }
        console.log(`[CACHE] MISS: ${key}`);
        return null;
    } catch (error) {
        console.error(`[CACHE] Error getting key ${key}:`, error.message);
        return null;
    }
};

/**
 * Set value in cache with expiration
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
export const setCache = async (key, value, ttl = 300) => {
    try {
        await redis.setex(key, ttl, JSON.stringify(value));
        console.log(`[CACHE] SET: ${key} (TTL: ${ttl}s)`);
        return true;
    } catch (error) {
        console.error(`[CACHE] Error setting key ${key}:`, error.message);
        return false;
    }
};

/**
 * Delete a key from cache
 * @param {string} key - Cache key to delete
 */
export const deleteCache = async (key) => {
    try {
        await redis.del(key);
        console.log(`[CACHE] DELETE: ${key}`);
        return true;
    } catch (error) {
        console.error(`[CACHE] Error deleting key ${key}:`, error.message);
        return false;
    }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "user:*")
 */
export const deleteCachePattern = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`[CACHE] DELETE PATTERN: ${pattern} (${keys.length} keys)`);
        }
        return true;
    } catch (error) {
        console.error(`[CACHE] Error deleting pattern ${pattern}:`, error.message);
        return false;
    }
};

/**
 * Check if Redis is connected
 */
export const checkRedisConnection = async () => {
    try {
        await redis.ping();
        console.log('[CACHE] ✅ Redis connected successfully');
        return true;
    } catch (error) {
        console.error('[CACHE] ❌ Redis connection failed:', error.message);
        return false;
    }
};

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const cacheKeys = {
    // User-related keys
    user: (userId) => `user:${userId}`,
    userProfile: (userId) => `user:${userId}:profile`,

    // Company-related keys
    company: (companyId) => `company:${companyId}`,
    companyUsers: (companyId) => `company:${companyId}:users`,

    // Marketplace keys
    marketplaceList: (page, limit) => `marketplace:list:${page}:${limit}`,
    marketplaceCompany: (companyId) => `marketplace:company:${companyId}`,

    // Chat/Teams keys
    teamMembers: (teamId) => `team:${teamId}:members`,
    channelMessages: (channelId) => `channel:${channelId}:messages`,
};

// ============================================
// CACHE TTL VALUES (in seconds)
// ============================================

export const cacheTTL = {
    SHORT: 60,           // 1 minute - for frequently changing data
    MEDIUM: 300,         // 5 minutes - default
    LONG: 900,           // 15 minutes - for rarely changing data
    EXTENDED: 3600,      // 1 hour - for static data
    DAY: 86400,          // 1 day - for very static data
};

export default redis;
