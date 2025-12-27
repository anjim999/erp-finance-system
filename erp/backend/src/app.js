// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';
import projectRoutes from './routes/projects.js';
import insightRoutes from './routes/insights.js';
import companyRoutes from './routes/companies.js';
import hrRoutes from './routes/hr.js';
import inventoryRoutes from './routes/inventory.js';
import marketplaceRoutes from './routes/marketplace.js';
import crmRoutes from './routes/crm.js';
import notificationRoutes from './routes/notifications.js';
import companyRequestRoutes from './routes/companyRequests.js';
import accountRoutes from './routes/account.js';
import uploadRoutes from './routes/uploads.js';
import exportRoutes from './routes/exports.js';
import reviewRoutes from './routes/reviews.js';
import paymentRoutes from './routes/payments.js';
import meetingRoutes from './routes/meetings.js';
import calendarRoutes from './routes/calendar.js';
import subscriptionRoutes from './routes/subscriptions.js';

// Import middleware
import authMiddleware, { errorHandler } from './middleware/auth.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://vyapar360.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now, but log
            console.log('CORS request from:', origin);
        }
    },
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Devopod ERP API is running",
        timestamp: new Date().toISOString()
    });
});

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/finance", authMiddleware, financeRoutes);
app.use("/api/projects", authMiddleware, projectRoutes);
app.use("/api/insights", authMiddleware, insightRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/company-requests", companyRequestRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

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
app.use(errorHandler);

export default app;
