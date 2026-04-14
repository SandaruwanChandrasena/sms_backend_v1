import Project from "../models/Project.js";
import Task from "../models/Task.js";

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
      supervisorId: req.user._id, // logged-in supervisor
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// GET /api/projects — students see published projects, supervisors see their own
export const getProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === "student") {
      // students only see published projects
      projects = await Project.find({ status: "published" }).populate(
        "supervisorId",
        "name email",
      );
    } else if (req.user.role === "supervisor") {
      // supervisors see all their own projects (draft + published)
      projects = await Project.find({ supervisorId: req.user._id }).populate(
        "supervisorId",
        "name email",
      );
    } else {
      // admin sees everything
      projects = await Project.find().populate("supervisorId", "name email");
    }

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id — get single project with its tasks
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "supervisorId",
      "name email",
    );

    if (!project) {
      res.status(404);
      return next(new Error("Project not found"));
    }

    // also fetch tasks belonging to this project
    const tasks = await Task.find({ projectId: req.params.id }).sort({
      order: 1,
    }); // sort by task order

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
      return next(new Error("Project not found"));
    }

    // only the supervisor who created it can update
    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to update this project"));
    }

    // update only fields that were sent
    project.title = req.body.title ?? project.title;
    project.description = req.body.description ?? project.description;
    project.proposalPercentage =
      req.body.proposalPercentage ?? project.proposalPercentage;
    project.proposalDeadline =
      req.body.proposalDeadline ?? project.proposalDeadline;
    project.proposalTemplate =
      req.body.proposalTemplate ?? project.proposalTemplate;
    project.status = req.body.status ?? project.status;

    const updated = await project.save();
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
      return next(new Error("Project not found"));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to delete this project"));
    }

    // delete all tasks under this project too
    await Task.deleteMany({ projectId: project._id });

    await project.deleteOne();
    res.json({ message: "Project and its tasks deleted successfully" });
  } catch (error) {
    next(error);
  }
};
