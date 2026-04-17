import express from 'express';
import {
  createSubmission,
  getSubmissionsByTask,
  getMySubmission,
  downloadSubmission,
  reviewSubmission,
} from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.use(protect);

router.post('/',               allowRoles('student'),              upload.single('file'), createSubmission);
router.get('/my/:taskId',      allowRoles('student'),              getMySubmission);
router.get('/task/:taskId',    allowRoles('supervisor', 'admin'),  getSubmissionsByTask);
router.get('/:id/download',    allowRoles('supervisor', 'admin'),  downloadSubmission);
router.put('/:id/review',      allowRoles('supervisor'),           reviewSubmission);

export default router;