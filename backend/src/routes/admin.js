import express from 'express';
import { query } from '../db/pool.js';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import {
  getAllUsers,
  updateUserRole,
  getAuditLogs,
  getIntegrations,
  testIntegration,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/integrations', getIntegrations);
router.post('/integrations/test', testIntegration);

export default router;
