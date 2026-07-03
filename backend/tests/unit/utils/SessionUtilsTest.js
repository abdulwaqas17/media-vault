import { jest } from "@jest/globals";

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    sessions: {
      updateMany: jest.fn()
    }
  }
}));

// Dynamic imports
const prisma = (await import("../../../src/config/prisma.js")).default;
const { ExpireUserSessions } = await import("../../../src/utils/SessionUtils.js");

describe("ExpireUserSessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Calls updateMany with correct where and data
  // ============================================================
  it("should call updateMany with correct where clause and data", async () => {
    const userId = "user_123";
    const mockResult = { count: 3 };
    
    prisma.sessions.updateMany.mockResolvedValue(mockResult);
    
    const result = await ExpireUserSessions(userId);
    
    expect(prisma.sessions.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });
    expect(result).toBe(true);

  });

  // ============================================================
  // TEST 3: Returns true even when no sessions are updated
  // ============================================================
  it("should return true even when no sessions are updated", async () => {
    const userId = "user_123";
    const mockResult = { count: 0 };
    
    prisma.sessions.updateMany.mockResolvedValue(mockResult);
    
    const result = await ExpireUserSessions(userId);
    
    expect(result).toBe(true);
    expect(prisma.sessions.updateMany).toHaveBeenCalled();
  });

  // ============================================================
  // TEST 4: Propagates Prisma/database errors
  // ============================================================
  it("should throw database errors", async () => {
    const userId = "user_123";
    const dbError = new Error("Database connection failed");
    
    prisma.sessions.updateMany.mockRejectedValue(dbError);
    
    await expect(ExpireUserSessions(userId)).rejects.toThrow("Database connection failed");
    expect(prisma.sessions.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: userId,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });
  });
  
});