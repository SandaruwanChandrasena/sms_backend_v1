import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';

// POST /api/proposals — student submits a proposal
export const submitProposal = async (req, res, next) => {
  try {
    const { projectId, proposalData } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.status !== 'published') {
      res.status(400);
      return next(new Error('Project is not published yet'));
    }

    const existing = await Proposal.findOne({
      projectId,
      studentId: req.user._id,
    });

    if (existing && existing.status !== 'rejected') {
      res.status(400);
      return next(new Error('You already have an active proposal for this project'));
    }

    // auto assign system mark based on deadline
    const now = new Date();
    const isOnTime = now <= new Date(project.proposalDeadline);
    const systemMark = isOnTime ? 5 : 0;
    const systemMarkReason = isOnTime
      ? 'Submitted before deadline'
      : 'Submitted after deadline — 5% bonus mark not awarded';

    // resubmission after rejection
    if (existing && existing.status === 'rejected') {
      existing.proposalData      = proposalData;
      existing.status            = 'pending';
      existing.systemMark        = systemMark;
      existing.systemMarkReason  = systemMarkReason;
      existing.supervisorMark    = 0;
      existing.totalMark         = systemMark;
      existing.feedback          = '';
      existing.resubmissionCount += 1;
      existing.submittedAt       = now;
      await existing.save();

      // notify supervisor about resubmission
      await Notification.create({
        userId:    project.supervisorId,
        type:      'proposal_submitted',
        message:   `${req.user.name} resubmitted a proposal for "${project.title}"`,
        relatedId: project._id,
      });

      return res.json(existing);
    }

    // create new proposal
    const proposal = await Proposal.create({
      projectId,
      studentId:        req.user._id,
      proposalData,
      systemMark,
      systemMarkReason,
      totalMark:        systemMark,
      submittedAt:      now,
    });

    // notify supervisor about new proposal
    await Notification.create({
      userId:    project.supervisorId,
      type:      'proposal_submitted',
      message:   `${req.user.name} submitted a proposal for "${project.title}"`,
      relatedId: project._id,
    });

    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
};

// GET /api/proposals/my — student sees their own proposals
export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ studentId: req.user._id })
      .populate('projectId', 'title proposalPercentage proposalDeadline');

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

// GET /api/proposals/project/:projectId — supervisor sees all proposals
export const getProjectProposals = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to view these proposals'));
    }

    const proposals = await Proposal.find({ projectId: req.params.projectId })
      .populate('studentId', 'name email');

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

// PUT /api/proposals/:id/review — supervisor accepts or rejects
export const reviewProposal = async (req, res, next) => {
  try {
    const { status, supervisorMark, feedback } = req.body;

    const proposal = await Proposal.findById(req.params.id)
      .populate('projectId');

    if (!proposal) {
      res.status(404);
      return next(new Error('Proposal not found'));
    }

    if (proposal.projectId.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to review this proposal'));
    }

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400);
      return next(new Error('Status must be accepted or rejected'));
    }

    // max supervisor mark = proposalPercentage - 5
    const maxSupervisorMark = proposal.projectId.proposalPercentage - 5;
    if (supervisorMark > maxSupervisorMark) {
      res.status(400);
      return next(new Error(`Supervisor mark cannot exceed ${maxSupervisorMark}`));
    }

    proposal.status         = status;
    proposal.supervisorMark = supervisorMark ?? 0;
    proposal.feedback       = feedback ?? '';
    proposal.totalMark      = proposal.systemMark + proposal.supervisorMark;

    await proposal.save();

    // notify student about proposal decision
    await Notification.create({
      userId:    proposal.studentId,
      type:      status === 'accepted' ? 'proposal_accepted' : 'proposal_rejected',
      message:   status === 'accepted'
        ? `Your proposal for "${proposal.projectId.title}" was accepted!`
        : `Your proposal for "${proposal.projectId.title}" was rejected. ${feedback}`,
      relatedId: proposal._id,
    });

    res.json(proposal);
  } catch (error) {
    next(error);
  }
};