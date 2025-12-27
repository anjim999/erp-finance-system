// Cached Proxy Middleware for Vyapar360 Gateway
// Custom proxy that caches GET responses from backend services

import { getCache, setCache, cacheTTL } from '../utils/cache.js';

/**
 * Creates a cached proxy middleware
 * @param {string} targetBaseUrl - Base URL of the target service
 * @param {string} pathPrefix - Path prefix to add to requests
 * @param {Object} options - Configuration options
 * @param {number} options.ttl - Cache TTL in seconds
 * @param {function} options.keyGenerator - Custom cache key generator
 * @param {function} options.pathBuilder - Custom path builder for backend URL
 * @returns {function} Express middleware
 */
export const createCachedProxy = (targetBaseUrl, pathPrefix, options = {}) => {
    const {
        ttl = cacheTTL.MEDIUM,
        keyGenerator = null,
        pathBuilder = null
    } = options;

    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return proxyRequest(req, res, targetBaseUrl, pathPrefix, pathBuilder);
        }

        // Generate cache key
        const cacheKey = keyGenerator
            ? keyGenerator(req)
            : generateDefaultCacheKey(pathPrefix, req);

        try {
            // Check cache first
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                console.log(`[CACHED PROXY] Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`[CACHED PROXY] Cache MISS: ${cacheKey}`);

            // Build backend URL
            const backendPath = pathBuilder ? pathBuilder(req) : `${pathPrefix}${req.url}`;
            const backendUrl = `${targetBaseUrl}${backendPath}`;

            console.log(`[CACHED PROXY] Fetching: ${backendUrl}`);

            const response = await fetch(backendUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward any necessary headers
                    ...forwardHeaders(req)
                }
            });

            // Get response data
            const data = await response.json();

            // Cache successful responses only
            if (response.ok && data.success !== false) {
                setCache(cacheKey, data, ttl).catch(err => {
                    console.error('[CACHED PROXY] Error caching response:', err.message);
                });
            }

            // Return response with original status
            res.status(response.status).json(data);

        } catch (error) {
            console.error('[CACHED PROXY] Error:', error.message);
            // On error, try to proxy directly without cache
            return proxyRequest(req, res, targetBaseUrl, pathPrefix, pathBuilder);
        }
    };
};

/**
 * Forward relevant headers from client request
 */
const forwardHeaders = (req) => {
    const headers = {};

    // Forward user headers if present (for authenticated routes)
    if (req.headers['x-user-id']) headers['x-user-id'] = req.headers['x-user-id'];
    if (req.headers['x-user-email']) headers['x-user-email'] = req.headers['x-user-email'];
    if (req.headers['x-company-id']) headers['x-company-id'] = req.headers['x-company-id'];
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];

    return headers;
};

/**
 * Generate default cache key from path and query params
 */
const generateDefaultCacheKey = (pathPrefix, req) => {
    const queryString = Object.keys(req.query).length > 0
        ? ':' + Object.entries(req.query).sort().map(([k, v]) => `${k}=${v}`).join('&')
        : '';
    return `gateway:${pathPrefix}${req.path}${queryString}`;
};

/**
 * Fallback proxy request without caching
 */
const proxyRequest = async (req, res, targetBaseUrl, pathPrefix, pathBuilder = null) => {
    try {
        const backendPath = pathBuilder ? pathBuilder(req) : `${pathPrefix}${req.url}`;
        const backendUrl = `${targetBaseUrl}${backendPath}`;

        console.log(`[PROXY] Fetching: ${backendUrl}`);

        const response = await fetch(backendUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...forwardHeaders(req)
            },
            body: ['POST', 'PUT', 'PATCH'].includes(req.method)
                ? JSON.stringify(req.body)
                : undefined
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('[PROXY] Error:', error.message);
        res.status(502).json({
            success: false,
            error: 'Bad Gateway - Unable to reach backend service'
        });
    }
};

// ============================================
// PRE-CONFIGURED CACHED PROXIES
// ============================================

/**
 * Creates cached proxy for companies public routes
 * Mounted at /api/companies/public, /industries, /cities
 * @param {string} erpBackendUrl - ERP backend URL
 */
export const createCompaniesPublicCachedProxy = (erpBackendUrl) => {
    return createCachedProxy(erpBackendUrl, '', {
        ttl: cacheTTL.MEDIUM, // 5 minutes
        keyGenerator: (req) => {
            // Use baseUrl + path for full route
            const fullPath = req.baseUrl + req.path;

            // Marketplace listing: /api/companies/public
            if (fullPath === '/api/companies/public' || fullPath === '/api/companies/public/') {
                const page = req.query.page || 1;
                const limit = req.query.limit || 10;
                const search = req.query.search || '';
                const industry = req.query.industry || '';
                const city = req.query.city || '';
                return `companies:public:${page}:${limit}:${search}:${industry}:${city}`;
            }

            // Company details: /api/companies/public/:slug
            if (fullPath.startsWith('/api/companies/public/')) {
                const slug = fullPath.split('/api/companies/public/')[1];
                return `companies:detail:${slug}`;
            }

            // Industries list
            if (fullPath.includes('/industries')) {
                return 'companies:industries';
            }

            // Cities list
            if (fullPath.includes('/cities')) {
                return 'companies:cities';
            }

            // Default key using full path
            return `gateway:${fullPath}`;
        },
        // Pass the actual full path to backend
        pathBuilder: (req) => req.baseUrl + req.url
    });
};

/**
 * Creates cached proxy for marketplace reviews
 * Mounted at /api/marketplace/reviews
 * @param {string} erpBackendUrl - ERP backend URL
 */
export const createMarketplaceReviewsCachedProxy = (erpBackendUrl) => {
    return createCachedProxy(erpBackendUrl, '', {
        ttl: cacheTTL.MEDIUM, // 5 minutes
        keyGenerator: (req) => {
            const fullPath = req.baseUrl + req.path;

            // Reviews for a company: /api/marketplace/reviews/:company_id
            if (fullPath.startsWith('/api/marketplace/reviews/')) {
                const companyId = fullPath.split('/api/marketplace/reviews/')[1];
                return `marketplace:reviews:${companyId}`;
            }

            // Default key
            return `gateway:${fullPath}`;
        },
        // Pass the actual full path to backend
        pathBuilder: (req) => req.baseUrl + req.url
    });
};
