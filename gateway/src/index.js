// Gateway - API Gateway for Vyapar360 Microservices
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { PORT, ERP_BACKEND_URL, TEAMS_BACKEND_URL } from './config/env.js';
import authMiddleware, { errorHandler } from './middleware/auth.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://vyapar360.vercel.app",
    "https://vyapar360-mz39.vercel.app"
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

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.originalUrl}`);
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
// Middleware: Attach User Headers for Microservices
// ============================================
const attachUserHeaders = (req, res, next) => {
    if (req.user) {
        req.headers['x-user-id'] = String(req.user.userId || '');
        req.headers['x-user-email'] = String(req.user.email || '');
        req.headers['x-user-name'] = String(req.user.name || '');
        req.headers['x-user-role'] = String(req.user.role || '');
        req.headers['x-company-id'] = String(req.user.companyId || '');
        console.log(`[GATEWAY] Attached headers for user: ${req.user.email} (${req.user.userId})`);
    } else {
        console.log('[GATEWAY] No user found to attach headers');
    }
    next();
};

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
// PUBLIC ROUTES (No auth - proxy directly)
// ============================================

// Auth routes - no authentication needed
app.use("/api/auth", (req, res, next) => {
    console.log(`[GATEWAY] Proxying auth request: ${req.method} /api/auth${req.url}`);
    next();
}, createERPProxy("/api/auth"));

// Companies routes - public
app.use("/api/companies", createERPProxy("/api/companies"));

// Marketplace routes - public
app.use("/api/marketplace", createERPProxy("/api/marketplace"));

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
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`📡 ERP Backend: ${ERP_BACKEND_URL}`);
    console.log(`📡 Teams Backend: ${TEAMS_BACKEND_URL}`);
});
