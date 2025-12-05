import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';
import projectRoutes from './routes/projects.js';
import insightRoutes from './routes/insights.js';
import authMiddleware, { errorHandler } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/finance', authMiddleware, financeRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/insights', authMiddleware, insightRoutes);

app.use(errorHandler);

export default app;
