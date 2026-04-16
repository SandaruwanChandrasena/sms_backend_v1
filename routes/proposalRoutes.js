import express from 'express';
import {
  submitProposal,
  getMyProposals,
  getProjectProposals,
  reviewProposal,
} from '../controllers/proposalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// student submits a proposal
router.post('/', allowRoles('student'), submitProposal);

// student sees their own proposals
router.get('/my', allowRoles('student'), getMyProposals);

// supervisor sees all proposals for a project
router.get('/project/:projectId', allowRoles('supervisor'), getProjectProposals);

// supervisor reviews a proposal
router.put('/:id/review', allowRoles('supervisor'), reviewProposal);

export default router;