import Task from "../models/Task";


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

