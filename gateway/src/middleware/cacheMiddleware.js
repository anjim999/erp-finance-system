// Cache Middleware for Vyapar360 Gateway
// Intercepts responses and caches them for faster subsequent requests

import { getCache, setCache, cacheKeys, cacheTTL } from '../utils/cache.js';

// ============================================
// CACHE MIDDLEWARE FACTORY
// Creates middleware that caches GET responses
// ============================================

/**
 * Creates caching middleware for a specific key generator
 * @param {function} keyGenerator - Function to generate cache key from request
 * @param {number} ttl - Time to live in seconds
 * @returns {function} Express middleware
 */
export const createCacheMiddleware = (keyGenerator, ttl = cacheTTL.MEDIUM) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator(req);

        try {
            // Check cache first
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                // Return cached response
                console.log(`[CACHE MIDDLEWARE] Returning cached data for: ${cacheKey}`);
                return res.json(cachedData);
            }

            // No cache hit - store original res.json to intercept response
            const originalJson = res.json.bind(res);

            res.json = (data) => {
                // Cache the response (non-blocking)
                setCache(cacheKey, data, ttl).catch(err => {
                    console.error('[CACHE MIDDLEWARE] Error caching response:', err.message);
                });

                // Send original response
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('[CACHE MIDDLEWARE] Error:', error.message);
            // On cache error, continue without caching
            next();
        }
    };
};

// ============================================
// PRE-CONFIGURED MARKETPLACE CACHE MIDDLEWARE
// ============================================

/**
 * Cache middleware for marketplace listing
 * Key: marketplace:list:{page}:{limit}
 * TTL: 5 minutes (data doesn't change frequently)
 */
export const marketplaceListCache = createCacheMiddleware(
    (req) => {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        return `marketplace:list:${page}:${limit}:${search}:${category}`;
    },
    cacheTTL.MEDIUM // 5 minutes
);

/**
 * Cache middleware for single company details
 * Key: marketplace:company:{companyId}
 * TTL: 15 minutes (company details rarely change)
 */
export const marketplaceCompanyCache = createCacheMiddleware(
    (req) => {
        const companyId = req.params.companyId || req.url.split('/')[1];
        return cacheKeys.marketplaceCompany(companyId);
    },
    cacheTTL.LONG // 15 minutes
);

// ============================================
// CACHE INVALIDATION MIDDLEWARE
// Clears cache when data is modified
// ============================================

/**
 * Invalidates marketplace cache after POST/PUT/DELETE operations
 */
export const invalidateMarketplaceCache = async (req, res, next) => {
    // Only invalidate on write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const originalJson = res.json.bind(res);

        res.json = async (data) => {
            try {
                // Import deleteCache dynamically to avoid circular dependency
                const { deleteCachePattern } = await import('../utils/cache.js');

                // Clear all marketplace cache entries
                await deleteCachePattern('marketplace:*');
                console.log('[CACHE MIDDLEWARE] Marketplace cache invalidated');
            } catch (error) {
                console.error('[CACHE MIDDLEWARE] Error invalidating cache:', error.message);
            }

            return originalJson(data);
        };
    }

    next();
};
