import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// all routes below require a valid token
router.use(protect);

router.get('/',      getTasks);
router.get('/:id',   getTaskById);
router.post('/',     allowRoles('supervisor'), createTask);
router.put('/:id',   updateTask);
router.delete('/:id', allowRoles('supervisor'), deleteTask);

export default router;