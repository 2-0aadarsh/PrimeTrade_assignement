import { logger } from "../utils/logger.util.js";

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  logger.error("Request failed", {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
