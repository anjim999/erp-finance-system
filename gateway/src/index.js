// Gateway - API Gateway for Vyapar360 Microservices
// IMPORTANT: Sentry must be imported FIRST before all other imports
import './instrument.js';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PORT, ERP_BACKEND_URL, TEAMS_BACKEND_URL } from './config/env.js';
import authMiddleware, { errorHandler } from './middleware/auth.js';
import { globalLimiter, authLimiter, apiLimiter } from './middleware/rateLimit.js';
import { createCompaniesPublicCachedProxy, createMarketplaceReviewsCachedProxy } from './middleware/cachedProxy.js';
import {
    invalidateCompaniesCache,
    invalidateCompanyCache,
    invalidateCompanyReviewsCache,
    invalidateAllCache
} from './utils/cacheInvalidation.js';

// ============================================
// MIDDLEWARE
// ============================================
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// ... (keep creating app)
const app = express();

// 1. Request ID (Must be first to trace everything)
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// 2. Security Headers
app.use(helmet());

// 3. Compression
app.use(compression());

// Apply global rate limiter to all requests
app.use(globalLimiter);
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://vyapar360.vercel.app",
    "https://vyapar360-mz39.vercel.app",
    "https://vyapar360dev.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
            console.log('CORS request from:', origin);
        }
    },
    credentials: true
}));

app.use(morgan("dev"));
// app.use(express.json()); // REMOVED: Global json parsing causes proxy hanging. Applied only to routes that need it.

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`[GATEWAY] [${req.id}] ${req.method} ${req.originalUrl}`);
    next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Vyapar360 API Gateway is running",
        timestamp: new Date().toISOString(),
        services: {
            erp: ERP_BACKEND_URL,
            teams: TEAMS_BACKEND_URL
        }
    });
});

// ============================================
// CACHE INVALIDATION ENDPOINTS (Internal use)
// Called by ERP backend when data is modified
// ============================================

// Verify internal request (simple secret check)
// In development, if INTERNAL_SECRET is not set, allow all internal requests
const verifyInternalRequest = (req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    const configuredSecret = process.env.INTERNAL_SECRET;

    // If no secret is configured (development mode), allow the request
    if (!configuredSecret) {
        console.log(`[INTERNAL] [${req.id}] ⚠️ INTERNAL_SECRET not configured, allowing request (dev mode)`);
        return next();
    }

    // In production, verify the secret
    if (internalSecret !== configuredSecret) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
};

// Invalidate all companies cache
app.post("/api/internal/cache/invalidate/companies", verifyInternalRequest, async (req, res) => {
    const result = await invalidateCompaniesCache();
    res.json({ success: result, message: result ? 'Companies cache invalidated' : 'Failed to invalidate cache' });
});

// Invalidate specific company cache
app.post("/api/internal/cache/invalidate/company/:slug", verifyInternalRequest, async (req, res) => {
    const result = await invalidateCompanyCache(req.params.slug);
    res.json({ success: result, message: result ? `Company ${req.params.slug} cache invalidated` : 'Failed to invalidate cache' });
});

// Invalidate company reviews cache
app.post("/api/internal/cache/invalidate/reviews/:companyId", verifyInternalRequest, async (req, res) => {
    const result = await invalidateCompanyReviewsCache(req.params.companyId);
    res.json({ success: result, message: result ? 'Reviews cache invalidated' : 'Failed to invalidate cache' });
});

// Invalidate ALL cache (admin only, use with caution)
app.post("/api/internal/cache/invalidate/all", verifyInternalRequest, async (req, res) => {
    const result = await invalidateAllCache();
    res.json({ success: result, message: result ? 'All cache invalidated' : 'Failed to invalidate cache' });
});

// ============================================
// Middleware: Attach User Headers for Microservices
// ============================================
const attachUserHeaders = (req, res, next) => {
    // Always forward the Request ID
    req.headers['x-request-id'] = req.id;

    if (req.user) {
        req.headers['x-user-id'] = String(req.user.userId || '');
        req.headers['x-user-email'] = String(req.user.email || '');
        req.headers['x-user-name'] = String(req.user.name || '');
        req.headers['x-user-role'] = String(req.user.role || '');
        req.headers['x-company-id'] = String(req.user.companyId || '');
        console.log(`[GATEWAY] [${req.id}] Attached headers for user: ${req.user.email} (${req.user.userId})`);
    } else {
        console.log(`[GATEWAY] [${req.id}] No user found to attach headers`);
    }
    next();
};

// ============================================
// Helper to create proxy with path preservation
// ============================================
// ============================================
// Helper to create proxy with path preservation
// ============================================
const createERPProxy = (mountPath) => {
    return createProxyMiddleware({
        target: ERP_BACKEND_URL,
        changeOrigin: true,
        pathRewrite: (path) => mountPath + path,
        onProxyReq: (proxyReq, req, res) => {
            // Logs for debugging
            // console.log(`[ERP PROXY] ${req.method} ${req.url}`);
        }
    });
};

const createTeamsProxy = (mountPath) => {
    return createProxyMiddleware({
        target: TEAMS_BACKEND_URL,
        changeOrigin: true,
        pathRewrite: (path) => mountPath + path,
        onProxyReq: (proxyReq, req, res) => {
            // console.log(`[TEAMS PROXY] ${req.method} ${req.url}`);
        }
    });
};

// ============================================
// PUBLIC ROUTES
// ============================================

// Auth routes - Manual proxy to avoid streaming issues
app.use("/api/auth", authLimiter, express.json(), async (req, res) => {
    // Strip the mount point prefix if needed, or use req.url if it excludes mount point
    // express app.use strips the mount path from req.url
    // So if request is /api/auth/login, req.url is /login
    const url = `${ERP_BACKEND_URL}/api/auth${req.url}`;
    console.log(`[GATEWAY] Manual Proxy to: ${url}`);

    try {
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json'
            },
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(url, options);

        // Forward status
        res.status(response.status);

        // Forward response headers (skip encoding headers since we re-serialize)
        const skipHeaders = ['content-encoding', 'content-length', 'transfer-encoding'];
        response.headers.forEach((value, key) => {
            if (!skipHeaders.includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });

        // Forward body
        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('[GATEWAY] Auth Proxy Error:', error);
        res.status(502).json({ message: 'Auth Service Unavailable' });
    }
});

// Companies routes - PUBLIC with CACHING
// cachedProxy uses 'fetch' and needs req.body parsed for POST requests
app.use("/api/companies/public", express.json(), createCompaniesPublicCachedProxy(ERP_BACKEND_URL));
app.use("/api/companies/industries", express.json(), createCompaniesPublicCachedProxy(ERP_BACKEND_URL));
app.use("/api/companies/cities", express.json(), createCompaniesPublicCachedProxy(ERP_BACKEND_URL));

// Companies routes - PROTECTED (proxy directly)
app.use("/api/companies", authMiddleware, attachUserHeaders, createERPProxy("/api/companies"));

// Marketplace routes - Reviews are cached (needs parsing), other routes need auth (proxy directly)
app.use("/api/marketplace/reviews", express.json(), createMarketplaceReviewsCachedProxy(ERP_BACKEND_URL));
app.use("/api/marketplace", authMiddleware, attachUserHeaders, createERPProxy("/api/marketplace"));

// ============================================
// PROTECTED ROUTES - Auth validated by Gateway
// ============================================

// Teams Backend Routes (chat, teams)
app.use("/api/chat", authMiddleware, attachUserHeaders, createTeamsProxy("/api/chat"));

app.use("/api/teams", authMiddleware, attachUserHeaders, createTeamsProxy("/api/teams"));

// ERP Backend Routes (everything else)
app.use("/api", authMiddleware, attachUserHeaders, createERPProxy("/api"));

// ============================================
// STATIC FILES (proxy to ERP backend)
// ============================================
app.use("/uploads", createProxyMiddleware({
    target: ERP_BACKEND_URL,
    changeOrigin: true,
    pathRewrite: (path) => '/uploads' + path
}));

// ============================================
// SENTRY DEBUG ENDPOINT (for testing)
// ============================================
app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("Sentry test error from Gateway!");
});

// ============================================
// SENTRY ERROR HANDLER (must be before other error handlers)
// ============================================
Sentry.setupExpressErrorHandler(app);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    console.log(`[GATEWAY 404] No route matched for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: "Route not found"
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, async () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📡 ERP Backend: ${ERP_BACKEND_URL}`);
    console.log(`📡 Teams Backend: ${TEAMS_BACKEND_URL}`);

    // Check Redis connection (optional - won't fail if Redis is not configured)
    if (process.env.UPSTASH_REDIS_REST_URL) {
        const { checkRedisConnection } = await import('./utils/cache.js');
        await checkRedisConnection();
    } else {
        console.log('⚠️  Redis caching not configured (UPSTASH_REDIS_REST_URL not set)');
    }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = () => {
    console.log('\n[GATEWAY] Received kill signal, shutting down gracefully...');
    server.close(() => {
        console.log('[GATEWAY] Closed out remaining connections.');
        process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
        console.error('[GATEWAY] Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
