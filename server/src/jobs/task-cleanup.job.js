import Task from "../models/task.model.js";
import { logger } from "../utils/logger.util.js";

const SOFT_DELETE_RETENTION_DAYS = Number(
  process.env.SOFT_DELETE_RETENTION_DAYS || 60
);
const CLEANUP_INTERVAL_MS = Number(
  process.env.SOFT_DELETE_CLEANUP_INTERVAL_MS || 24 * 60 * 60 * 1000
);

export const deleteExpiredSoftDeletedTasks = async () => {
  const cutoffDate = new Date(
    Date.now() - SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const result = await Task.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: cutoffDate },
  });

  logger.info("Soft-deleted task cleanup finished", {
    deletedCount: result.deletedCount || 0,
    retentionDays: SOFT_DELETE_RETENTION_DAYS,
  });
};

export const startTaskCleanupJob = () => {
  const run = async () => {
    try {
      await deleteExpiredSoftDeletedTasks();
    } catch (error) {
      logger.error("Soft-deleted task cleanup failed", {
        error: error.message,
      });
    }
  };

  run();
  return setInterval(run, CLEANUP_INTERVAL_MS);
};
