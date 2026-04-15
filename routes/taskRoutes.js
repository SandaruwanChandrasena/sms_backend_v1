import express from "express";
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask,
  closeSubmission,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/project/:projectId", getTasksByProject);
router.get("/:id", getTaskById);
router.post("/", allowRoles("supervisor"), createTask);
router.put("/:id", allowRoles("supervisor"), updateTask);
router.delete("/:id", allowRoles("supervisor"), deleteTask);
router.put("/:id/close", allowRoles("supervisor"), closeSubmission);

export default router;
