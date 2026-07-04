import { jest } from "@jest/globals";

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    sessions: {
      deleteMany: jest.fn()
    }
  }
}));

// Mock logger
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Dynamic imports
const prisma = (await import("../../../src/config/prisma.js")).default;
const logger = (await import("../../../src/config/logger.js")).default;
const { DeleteExpiredSessions } = await import("../../../src/utils/CronJobUtils.js");

describe("DeleteExpiredSessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should delete expired sessions successfully
  // ============================================================
  it("should delete expired sessions and return count", async () => {
    const mockResult = { count: 5 };
    
    prisma.sessions.deleteMany.mockResolvedValue(mockResult);
    
    const result = await DeleteExpiredSessions();
    
    expect(prisma.sessions.deleteMany).toHaveBeenCalledWith({
      where: {
        expires_at: {
          lt: expect.any(Date)
        }
      }
    });
    expect(result).toBe(5);
    expect(logger.info).toHaveBeenCalledWith(
      "Cron Job: Deleted 5 expired sessions"
    );
  });

  // ============================================================
  // TEST 2: Should handle zero expired sessions
  // ============================================================
  it("should not log info when no sessions are deleted", async () => {
    const mockResult = { count: 0 };
    
    prisma.sessions.deleteMany.mockResolvedValue(mockResult);
    
    const result = await DeleteExpiredSessions();
    
    expect(result).toBe(0);
    expect(logger.info).not.toHaveBeenCalled();
  });

  // ============================================================
  // TEST 3: Should propagate database errors
  // ============================================================
  it("should throw and log error when database operation fails", async () => {
    const dbError = new Error("Database connection failed");
    
    prisma.sessions.deleteMany.mockRejectedValue(dbError);
    
    await expect(DeleteExpiredSessions()).rejects.toThrow(
      "Database connection failed"
    );
    
    expect(logger.error).toHaveBeenCalledWith(
      "Cron Job Error: Failed to delete expired sessions",
      dbError
    );
  });


});