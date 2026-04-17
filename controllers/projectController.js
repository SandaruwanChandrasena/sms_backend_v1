import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// POST /api/projects — supervisor creates a project
export const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      proposalPercentage,
      proposalDeadline,
      proposalTemplate,
    } = req.body;

    const project = await Project.create({
      title,
      description,
      proposalPercentage,
      proposalDeadline,
      proposalTemplate,
      supervisorId: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// GET /api/projects — role based project listing
export const getProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'student') {
      // students only see published projects
      projects = await Project.find({ status: 'published' })
        .populate('supervisorId', 'name email');

    } else if (req.user.role === 'supervisor') {
      // supervisors see their own projects
      projects = await Project.find({ supervisorId: req.user._id })
        .populate('supervisorId', 'name email');

    } else {
      // admin sees everything
      projects = await Project.find()
        .populate('supervisorId', 'name email');
    }

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id — get single project with its tasks
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('supervisorId', 'name email');

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    // fetch tasks belonging to this project sorted by order
    const tasks = await Task.find({ projectId: req.params.id })
      .sort({ order: 1 });

    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id — supervisor updates their project
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to update this project'));
    }

    // check if project is being published for the first time
    const isBeingPublished =
      req.body.status === 'published' && project.status === 'draft';

    project.title              = req.body.title              ?? project.title;
    project.description        = req.body.description        ?? project.description;
    project.proposalPercentage = req.body.proposalPercentage ?? project.proposalPercentage;
    project.proposalDeadline   = req.body.proposalDeadline   ?? project.proposalDeadline;
    project.proposalTemplate   = req.body.proposalTemplate   ?? project.proposalTemplate;
    project.status             = req.body.status             ?? project.status;

    const updated = await project.save();

    // notify all students when project is published
    if (isBeingPublished) {
      const students = await User.find({ role: 'student', isActive: true });
      const notifications = students.map((student) => ({
        userId:    student._id,
        type:      'project_published',
        message:   `New project published: "${project.title}"`,
        relatedId: project._id,
      }));
      await Notification.insertMany(notifications);
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id — supervisor deletes their project
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      return next(new Error('Project not found'));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this project'));
    }

    // delete all tasks under this project
    await Task.deleteMany({ projectId: project._id });

    await project.deleteOne();
    res.json({ message: 'Project and its tasks deleted successfully' });
  } catch (error) {
    next(error);
  }
};