import Task from "../models/Task.js";
import Project from "../models/Project.js";

// helper — recalculates totalMarks for all tasks in a project
const recalculateTaskMarks = async (projectId) => {
  const project = await Project.findById(projectId);
  const tasks = await Task.find({ projectId });

  if (!project || tasks.length === 0) return;

  const remaining = 100 - project.proposalPercentage;
  const marksPerTask = parseFloat((remaining / tasks.length).toFixed(2));

  await Task.updateMany({ projectId }, { totalMarks: marksPerTask });
};

// helper — resequences order for all tasks in a project (1, 2, 3...)
const resequenceOrder = async (projectId) => {
  const tasks = await Task.find({ projectId }).sort({ order: 1 });

  // reassign order cleanly starting from 1
  for (let i = 0; i < tasks.length; i++) {
    tasks[i].order = i + 1;
    await tasks[i].save();
  }
};

// POST /api/tasks — supervisor adds a task, order is auto assigned
export const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, deadline } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404);
      return next(new Error("Project not found"));
    }

    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to add tasks to this project"));
    }

    // count existing tasks to auto assign next order number
    const taskCount = await Task.countDocuments({ projectId });
    const autoOrder = taskCount + 1;

    const task = await Task.create({
      projectId,
      title,
      description,
      deadline,
      order: autoOrder, // system assigns order automatically
    });

    // recalculate marks for all tasks
    await recalculateTaskMarks(projectId);

    const updatedTask = await Task.findById(task._id);
    res.status(201).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/project/:projectId — get all tasks sorted by order
export const getTasksByProject = async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId }).sort({
      order: 1,
    });

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

// PUT /api/tasks/:id — supervisor updates task details
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error("Task not found"));
    }

    const project = await Project.findById(task.projectId);
    if (project.supervisorId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error("Not authorized to update this task"));
    }

    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.deadline = req.body.deadline ?? task.deadline;

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

    // resequence remaining tasks and recalculate marks
    await resequenceOrder(projectId);
    await recalculateTaskMarks(projectId);

    res.json({ message: "Task deleted, order and marks recalculated" });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/reorder — supervisor drags to reorder tasks
export const reorderTasks = async (req, res, next) => {
  try {
    // expects array: [{ id, order }, { id, order }...]
    const { tasks } = req.body;

    // update each task with its new order
    for (const item of tasks) {
      await Task.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id/close — closes submission link
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
