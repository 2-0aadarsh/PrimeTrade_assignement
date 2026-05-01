import { Router } from "express";

import {
  forceLogoutUser,
  getAllUsers,
  getSystemSummary,
  setUserRole,
  setUserStatus,
} from "../controllers/admin.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  validateAdminSetUserRole,
  validateAdminSetUserStatus,
  validateAdminUserIdParam,
} from "../validators/admin.validator.js";

const adminRouter = Router();

adminRouter.use(protect, authorize("admin"));

adminRouter.get("/summary", getSystemSummary);
adminRouter.get("/users", getAllUsers);
adminRouter.patch(
  "/users/:userId/status",
  validateRequest(validateAdminUserIdParam, "params"),
  validateRequest(validateAdminSetUserStatus),
  setUserStatus
);
adminRouter.patch(
  "/users/:userId/role",
  validateRequest(validateAdminUserIdParam, "params"),
  validateRequest(validateAdminSetUserRole),
  setUserRole
);
adminRouter.post(
  "/users/:userId/force-logout",
  validateRequest(validateAdminUserIdParam, "params"),
  forceLogoutUser
);

export default adminRouter;
