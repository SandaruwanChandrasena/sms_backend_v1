import Task from "../models/Task.js";
import Project from "../models/Project.js";

// helper — recalculates and updates totalMarks for all tasks in a project
const recalculateTaskMarks = async (projectId) => {
  const project = await Project.findById(projectId);
  const tasks = await Task.find({ projectId });

  if (!project || tasks.length === 0) return;

  // remaining marks after proposal percentage
  const remaining = 100 - project.proposalPercentage;
  const marksPerTask = parseFloat((remaining / tasks.length).toFixed(2));

  // update every task with the new equal mark
  await Task.updateMany({ projectId }, { totalMarks: marksPerTask });
};

// POST /api/tasks — supervisor adds a task to a project
export const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, deadline, order } = req.body;

    // verify the project exists and belongs to this supervisor
    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error("Project not found"));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to add tasks to this project"));
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      deadline,
      order: order ?? 1,
    });

    // recalculate marks for all tasks in this project
    await recalculateTaskMarks(projectId);

    // return updated task with new marks
    const updatedTask = await Task.findById(task._id);
    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/project/:projectId — get all tasks for a project
export const getTasksByProject = async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId }).sort({
      order: 1,
    }); // return in order

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id — get single task
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "projectId",
      "title proposalPercentage",
    );

    if (!task) {
      res.status(404);
      return next(new Error("Task not found"));
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id — supervisor updates a task
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error("Task not found"));
    }

    // verify ownership through the project
    const project = await Project.findById(task.projectId);
    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to update this task"));
    }

    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.deadline = req.body.deadline ?? task.deadline;
    task.order = req.body.order ?? task.order;

    await task.save();
    res.json(task);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id — supervisor deletes a task
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error("Task not found"));
    }

    const project = await Project.findById(task.projectId);
    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to delete this task"));
    }

    const projectId = task.projectId;
    await task.deleteOne();

    // recalculate marks for remaining tasks after deletion
    await recalculateTaskMarks(projectId);

    res.json({ message: "Task deleted and marks recalculated" });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id/close — system closes submission link after 30 mins
export const closeSubmission = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error("Task not found"));
    }

    task.submissionOpen = false;
    await task.save();

    res.json({ message: "Submission closed for this task" });
  } catch (error) {
    next(error);
  }
};
