import express from 'express';
import requireRole from '../middleware/requireRole.js';
import {
  getProjectRisk,
  getAllProjectsRisk,
  getCashFlowForecast,
  getProjectProgressInsight,
} from '../controllers/insightController.js';

const router = express.Router();

router.use(requireRole('admin', 'finance_manager', 'project_manager'));

router.get('/project-risk/:projectId', getProjectRisk);
router.get('/project-risk', getAllProjectsRisk);
router.get('/cash-flow-forecast', getCashFlowForecast);
router.get('/project-progress/:projectId', getProjectProgressInsight);

export default router;
