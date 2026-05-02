import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";

import { connectDB, disconnectDB } from "./configs/mongodb.config.js";
import redis, { disconnectRedis } from "./configs/redis.config.js";
import { setupSwagger } from "./docs/swagger.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { createSlidingWindowRateLimiter } from "./middlewares/rate-limit.middleware.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import apiRouter from "./routes/index.routes.js";
import { startTaskCleanupJob } from "./jobs/task-cleanup.job.js";
import { logger } from "./utils/logger.util.js";

dotenv.config();

const isVercel = process.env.VERCEL === "1";

/** Browser dev servers (Vite, CRA, etc.) — any port */
const LOCAL_BROWSER_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const deploymentOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (LOCAL_BROWSER_ORIGIN.test(origin)) {
      return callback(null, true);
    }
    if (deploymentOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn("CORS blocked request", { origin });
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();
const port = Number(process.env.PORT || 5000);
const globalRateLimitWindowMs = Number(
  process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);
const globalRateLimitMaxRequests = Number(
  process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS || 300
);

app.use(helmet());
app.use(cors(corsOptions));
app.use(hpp());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
setupSwagger(app);
app.use(
  createSlidingWindowRateLimiter({
    keyPrefix: "rate-limit:global",
    windowMs: globalRateLimitWindowMs,
    maxRequests: globalRateLimitMaxRequests,
    message: "Too many requests. Please try again in a few minutes.",
  })
);

/** Serverless (Vercel): no app.listen — connect Mongo per cold start; connection is cached */
if (isVercel) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      logger.error("MongoDB connection failed", { error: error.message });
      next(error);
    }
  });
}

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

async function startLocalServer() {
  await connectDB();

  try {
    await redis.ping();
  } catch (error) {
    logger.warn("Redis not available at startup. Continuing without Redis.");
  }

  const cleanupInterval = startTaskCleanupJob();

  const server = app.listen(port, () => {
    logger.info("Server started", { port });
  });

  const shutdown = async (signal) => {
    logger.info("Shutdown signal received", { signal });
    server.close(async () => {
      await Promise.allSettled([disconnectDB(), disconnectRedis()]);
      clearInterval(cleanupInterval);
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (!isVercel) {
  startLocalServer().catch((error) => {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  });
}
