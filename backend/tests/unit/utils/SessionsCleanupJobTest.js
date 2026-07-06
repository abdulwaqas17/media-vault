import { jest } from "@jest/globals";

// Mock node-cron
jest.unstable_mockModule("node-cron", () => ({
  default: {
    schedule: jest.fn()
  }
}));

// Mock logger
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Mock DeleteExpiredSessions
jest.unstable_mockModule("../../../src/utils/CronJobUtils.js", () => ({
  DeleteExpiredSessions: jest.fn()
}));

// Dynamic imports
const cron = (await import("node-cron")).default;
const logger = (await import("../../../src/config/logger.js")).default;
const { DeleteExpiredSessions } = await import("../../../src/utils/CronJobUtils.js");
const { ScheduleExpiredSessionCleanup } = await import("../../../src/jobs/SessionsCleanupJob.js");

describe("ScheduleExpiredSessionCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should register the cleanup cron job
  // ============================================================
  it("should register the cleanup cron job", () => {
    ScheduleExpiredSessionCleanup();

    expect(cron.schedule).toHaveBeenCalledWith(
      "0 * * * *",
      expect.any(Function)
    );
    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Cron Job Scheduled")
    );
  });

  // ============================================================
  // TEST 2: Should execute the scheduled cleanup successfully
  // ============================================================
  it("should execute the scheduled cleanup successfully", async () => {
    ScheduleExpiredSessionCleanup();

    // Get the job function from cron.schedule call
    const jobFunction = cron.schedule.mock.calls[0][1];
    
    DeleteExpiredSessions.mockResolvedValue(5);
    
    await jobFunction();

    expect(DeleteExpiredSessions).toHaveBeenCalled();
    expect(DeleteExpiredSessions).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Cron Job Started")
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Cron Job Completed")
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Deleted 5 sessions")
    );
  });

  // ============================================================
  // TEST 3: Should log error if cleanup job fails
  // ============================================================
  it("should log error if cleanup job fails", async () => {
    ScheduleExpiredSessionCleanup();

    const jobFunction = cron.schedule.mock.calls[0][1];
    
    const error = new Error("Database connection failed");
    DeleteExpiredSessions.mockRejectedValue(error);
    
    await jobFunction();

    expect(logger.error).toHaveBeenCalledWith(
      "Cron Job Failed: Session cleanup error",
      error
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});