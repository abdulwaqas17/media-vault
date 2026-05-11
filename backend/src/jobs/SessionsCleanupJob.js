import cron from "node-cron";
import logger from "../config/logger.js";
import { DeleteExpiredSessions } from "../utils/CronJobUtils.js";

/**
 * Session cleanup cron jobs
 * Industry standard scheduling
 */

// Job 1: Run every hour to delete expired sessions
// Cron pattern: "0 * * * *" = At minute 0 of every hour
export const ScheduleExpiredSessionCleanup = () => {
  cron.schedule("0 * * * *", async () => {
    logger.info("Cron Job Started: Deleting expired sessions");
    const startTime = Date.now();

    try {
      const deletedCount = await DeleteExpiredSessions();
      const duration = (Date.now() - startTime)/1000; // Convert ms to seconds

      logger.info(
        `Cron Job Completed: Deleted ${deletedCount} sessions in ${duration} seconds`,
      );
    } catch (error) {
      logger.error("Cron Job Failed: Session cleanup error", error);
    }
  });

  logger.info(
    "Cron Job Scheduled: Expired session cleanup will run every hour",
  );
};
