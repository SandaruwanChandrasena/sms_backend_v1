import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// all routes require login
router.use(protect);

router.get('/',      getProjects);
router.get('/:id',   getProjectById);
router.post('/',     allowRoles('supervisor'), createProject);
router.put('/:id',   allowRoles('supervisor'), updateProject);
router.delete('/:id', allowRoles('supervisor'), deleteProject);

export default router;