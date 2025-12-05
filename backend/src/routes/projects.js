import express from 'express';
import requireRole from '../middleware/requireRole.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  getProjectProgressHistory,
} from '../controllers/projectController.js';

const router = express.Router();

router.use(requireRole('project_manager', 'admin'));

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.get('/:id/progress', getProjectProgressHistory);

export default router;
