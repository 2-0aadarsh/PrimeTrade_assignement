import { Router } from "express";

import adminRouter from "./admin.routes.js";
import authRouter from "./auth.routes.js";
import taskRouter from "./task.routes.js";

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/admin", adminRouter);

export default apiRouter;
