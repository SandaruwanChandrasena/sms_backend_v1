import Proposal from "../models/Proposal.js";
import Project from "../models/Project.js";

// POST /api/proposals — student submits a proposal
export const submitProposal = async (req, res, next) => {
  try {
    const { projectId, proposalData } = req.body;

    // check project exists and is published
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error("Project not found"));
    }

    if (project.status !== "published") {
      res.status(400);
      return next(new Error("Project is not published yet"));
    }

    // block duplicate proposals — one per student per project
    const existing = await Proposal.findOne({
      projectId,
      studentId: req.user._id,
    });

    if (existing && existing.status !== "rejected") {
      res.status(400);
      return next(
        new Error("You already have an active proposal for this project"),
      );
    }

    // auto assign system mark based on proposal deadline
    const now = new Date();
    const systemMark = now <= new Date(project.proposalDeadline) ? 5 : 0;

    // if resubmitting after rejection update existing proposal
    if (existing && existing.status === "rejected") {
      existing.proposalData = proposalData;
      existing.status = "pending";
      existing.systemMark = systemMark;
      existing.supervisorMark = 0;
      existing.feedback = "";
      existing.resubmissionCount += 1;
      existing.submittedAt = now;
      await existing.save();
      return res.json(existing);
    }

    // create new proposal
    const proposal = await Proposal.create({
      projectId,
      studentId: req.user._id,
      proposalData,
      systemMark,
      submittedAt: now,
    });

    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
};

// GET /api/proposals/my — student sees their own proposals
export const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ studentId: req.user._id }).populate(
      "projectId",
      "title proposalPercentage proposalDeadline",
    );

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

// GET /api/proposals/project/:projectId — supervisor sees all proposals for their project
export const getProjectProposals = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      return next(new Error("Project not found"));
    }

    // only the supervisor who owns the project can see proposals
    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to view these proposals"));
    }

    const proposals = await Proposal.find({
      projectId: req.params.projectId,
    }).populate("studentId", "name email");

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

// PUT /api/proposals/:id/review — supervisor accepts or rejects proposal
export const reviewProposal = async (req, res, next) => {
  try {
    const { status, supervisorMark, feedback } = req.body;

    const proposal = await Proposal.findById(req.params.id).populate(
      "projectId",
    );

    if (!proposal) {
      res.status(404);
      return next(new Error("Proposal not found"));
    }

    // verify supervisor owns the project
    if (
      proposal.projectId.supervisorId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      return next(new Error("Not authorized to review this proposal"));
    }

    // status must be accepted or rejected
    if (!["accepted", "rejected"].includes(status)) {
      res.status(400);
      return next(new Error("Status must be accepted or rejected"));
    }

    // get proposal percentage to validate supervisor mark
    const maxSupervisorMark = proposal.projectId.proposalPercentage - 5;

    if (supervisorMark > maxSupervisorMark) {
      res.status(400);
      return next(
        new Error(`Supervisor mark cannot exceed ${maxSupervisorMark}`),
      );
    }

    proposal.status = status;
    proposal.supervisorMark = supervisorMark ?? 0;
    proposal.feedback = feedback ?? "";

    await proposal.save();
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};
