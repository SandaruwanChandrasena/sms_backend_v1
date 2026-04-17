import fs from 'fs';
import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';

// POST /api/submissions — student uploads work for a task
export const createSubmission = async (req, res, next) => {
  try {
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // check student has accepted proposal for this project
    const proposal = await Proposal.findOne({
      projectId: task.projectId,
      studentId: req.user._id,
      status: 'accepted',
    });

    if (!proposal) {
      res.status(403);
      return next(new Error('You need an accepted proposal to submit work'));
    }

    // check submission window — deadline + 30 minutes
    const now = new Date();
    const deadline = new Date(task.deadline);
    const thirtyMinsAfter = new Date(deadline.getTime() + 30 * 60 * 1000);

    if (now > thirtyMinsAfter) {
      // auto close submission link
      task.submissionOpen = false;
      await task.save();
      res.status(403);
      return next(new Error('Submission link is closed for this task'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('No file uploaded'));
    }

    // determine system mark based on deadline
    const isLate = now > deadline;
    const systemMark = isLate ? 0 : 5;
    const systemMarkReason = isLate
      ? 'Submitted after deadline — 5% bonus mark not awarded'
      : 'Submitted before deadline';

    // check if student already submitted for this task
    const existing = await Submission.findOne({
      taskId,
      studentId: req.user._id,
    });

    if (existing) {
      // delete old file from disk
      if (fs.existsSync(existing.filePath)) {
        fs.unlinkSync(existing.filePath);
      }

      existing.fileName         = req.file.originalname;
      existing.filePath         = req.file.path;
      existing.fileType         = req.file.mimetype;
      existing.fileSize         = req.file.size;
      existing.isLate           = isLate;
      existing.systemMark       = systemMark;
      existing.systemMarkReason = systemMarkReason;
      existing.supervisorMark   = 0;
      existing.totalMark        = systemMark;
      existing.submittedAt      = now;

      await existing.save();
      return res.json(existing);
    }

    // create new submission
    const submission = await Submission.create({
      taskId,
      studentId:        req.user._id,
      fileName:         req.file.originalname,
      filePath:         req.file.path,
      fileType:         req.file.mimetype,
      fileSize:         req.file.size,
      isLate,
      systemMark,
      systemMarkReason,
      totalMark:        systemMark,
    });

    // notify supervisor that student submitted work
    const project = await Project.findById(task.projectId);
    await Notification.create({
      userId:    project.supervisorId,
      type:      'submission_received',
      message:   `${req.user.name} submitted work for task "${task.title}"`,
      relatedId: task._id,
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

// GET /api/submissions/task/:taskId — supervisor sees all submissions for a task
export const getSubmissionsByTask = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ taskId: req.params.taskId })
      .populate('studentId', 'name email');

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

// GET /api/submissions/my/:taskId — student sees their own submission
export const getMySubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({
      taskId:    req.params.taskId,
      studentId: req.user._id,
    });

    if (!submission) {
      res.status(404);
      return next(new Error('No submission found for this task'));
    }

    res.json(submission);
  } catch (error) {
    next(error);
  }
};

// GET /api/submissions/:id/download — download submission file
export const downloadSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      res.status(404);
      return next(new Error('Submission not found'));
    }

    res.download(submission.filePath, submission.fileName);
  } catch (error) {
    next(error);
  }
};

// PUT /api/submissions/:id/review — supervisor gives mark and feedback
export const reviewSubmission = async (req, res, next) => {
  try {
    const { supervisorMark, feedback } = req.body;

    const submission = await Submission.findById(req.params.id)
      .populate('taskId');

    if (!submission) {
      res.status(404);
      return next(new Error('Submission not found'));
    }

    // max supervisor mark = task totalMarks - 5
    const maxSupervisorMark = submission.taskId.totalMarks - 5;
    if (supervisorMark > maxSupervisorMark) {
      res.status(400);
      return next(new Error(`Supervisor mark cannot exceed ${maxSupervisorMark}`));
    }

    submission.supervisorMark = supervisorMark ?? 0;
    submission.feedback       = feedback ?? '';
    submission.totalMark      = submission.systemMark + submission.supervisorMark;

    await submission.save();

    // notify student that submission was reviewed
    await Notification.create({
      userId:    submission.studentId,
      type:      'submission_reviewed',
      message:   `Your submission for "${submission.taskId.title}" has been reviewed. Mark: ${submission.totalMark}`,
      relatedId: submission._id,
    });

    res.json(submission);
  } catch (error) {
    next(error);
  }
};