import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  validateCreateTask,
  validateTaskIdParam,
  validateTaskQuery,
  validateUpdateTask,
} from "../validators/task.validator.js";

const taskRouter = Router();

taskRouter.use(protect);

taskRouter.post("/", validateRequest(validateCreateTask), createTask);
taskRouter.get("/", validateRequest(validateTaskQuery, "query"), getTasks);
taskRouter.get("/:taskId", validateRequest(validateTaskIdParam, "params"), getTaskById);
taskRouter.patch(
  "/:taskId",
  validateRequest(validateTaskIdParam, "params"),
  validateRequest(validateUpdateTask),
  updateTask
);
taskRouter.delete(
  "/:taskId",
  validateRequest(validateTaskIdParam, "params"),
  deleteTask
);

export default taskRouter;
