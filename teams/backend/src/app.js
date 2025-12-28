// Teams Backend - app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import routes
// Import routes
import chatRoutes from './routes/chat.js';
import teamsRoutes from './routes/teams.js';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// 1. Request ID (Extract from Gateway or generate)
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// 2. Security Headers
app.use(helmet());

// 3. Compression
app.use(compression());

// ============================================
// MIDDLEWARE
// ============================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5000", // Gateway
    "http://localhost:3000",
    "https://vyapar360.vercel.app"
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all requests with ID
app.use((req, res, next) => {
    console.log(`[TEAMS] [${req.id}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use(morgan("dev"));

// ============================================
// HELPER: Extract user from Gateway headers
// ============================================
app.use((req, res, next) => {
    // Gateway sends user info in headers after authentication
    const userId = req.headers['x-user-id'];
    const email = req.headers['x-user-email'];
    const name = req.headers['x-user-name'];
    const role = req.headers['x-user-role'];
    const companyId = req.headers['x-company-id'];

    // Debug: Log if headers are missing
    if (!userId && req.path.includes('/api/')) {
        console.log(`[TEAMS DEBUG] No user headers for ${req.method} ${req.path}`);
        console.log(`[TEAMS DEBUG] Headers:`, {
            'x-user-id': userId,
            'x-user-email': email,
            'x-user-name': name,
            'x-user-role': role,
            'x-company-id': companyId
        });
    }

    if (userId) {
        req.user = {
            userId: parseInt(userId),
            email: email || '',
            name: name || '',
            role: role || 'user',
            companyId: companyId ? parseInt(companyId) : null
        };
    }
    next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Teams Microservice is running",
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ROUTES
// ============================================
app.use("/api/chat", chatRoutes);
app.use("/api/teams", teamsRoutes);

// ============================================
// STATIC FILES (for uploaded files)
// ============================================
app.use("/uploads", express.static("uploads"));

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found"
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.message || "Internal Server Error",
    });
});

export default app;
