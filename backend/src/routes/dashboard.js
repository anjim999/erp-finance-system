import express from 'express';
import {
  getDashboardSummary,
  getCashFlowTrend,
  getAlerts,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', getDashboardSummary);
router.get('/cash-flow-trend', getCashFlowTrend);
router.get('/alerts', getAlerts);

export default router;
