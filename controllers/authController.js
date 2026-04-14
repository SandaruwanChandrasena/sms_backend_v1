import Task from '../models/Task.js';

// POST /api/tasks — supervisor creates and assigns a task
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, deadline, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      deadline,
      assignedTo,
      createdBy: req.user._id, // logged-in supervisor's id
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks — returns tasks based on who is logged in
export const getTasks = async (req, res, next) => {
  try {
    let tasks;

    if (req.user.role === 'supervisor') {
      // supervisor sees tasks they created
      tasks = await Task.find({ createdBy: req.user._id })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

    } else if (req.user.role === 'student') {
      // student sees tasks assigned to them
      tasks = await Task.find({ assignedTo: req.user._id })
        .populate('createdBy', 'name email');

    } else {
      // admin sees all tasks
      tasks = await Task.find()
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    }

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id — get a single task by id
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id — supervisor edits task, student can only update status
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    if (req.user.role === 'student') {
      // students can only change the status
      task.status = req.body.status ?? task.status;
    } else {
      // supervisors can update everything
      task.title       = req.body.title       ?? task.title;
      task.description = req.body.description ?? task.description;
      task.priority    = req.body.priority    ?? task.priority;
      task.deadline    = req.body.deadline    ?? task.deadline;
      task.assignedTo  = req.body.assignedTo  ?? task.assignedTo;
      task.status      = req.body.status      ?? task.status;
    }

    const updated = await task.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id — only the supervisor who created it can delete
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      return next(new Error('Task not found'));
    }

    // compare as strings because MongoDB ids are objects
    if (task.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this task'));
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};