import { jest } from "@jest/globals";

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    sessions: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    users: {
      findUnique: jest.fn()
    }
  }
}));

// Mock SessionUtils
jest.unstable_mockModule("../../../src/utils/SessionUtils.js", () => ({
  ExpireUserSessions: jest.fn()
}));

// Dynamic imports
const prisma = (await import("../../../src/config/prisma.js")).default;
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { ExpireUserSessions } = await import("../../../src/utils/SessionUtils.js");
const {
  GetUserSessionsService,
  RevokeSessionService,
  RevokeAllSessionsService
} = await import("../../../src/modules/session/SessionService.js");

describe("SessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // GET USER SESSIONS SERVICE TESTS
  // ============================================================
  describe("GetUserSessionsService", () => {
    const userId = "user_123";
    const mockSessions = [
      {
        id: "session_1",
        user_id: userId,
        is_active: true,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 86400000)
      },
      {
        id: "session_2",
        user_id: userId,
        is_active: false,
        created_at: new Date(Date.now() - 86400000),
        expires_at: new Date(Date.now() - 3600000)
      }
    ];

    // Test 1: Happy Path
    it("should return user sessions successfully", async () => {
      prisma.sessions.findMany.mockResolvedValue(mockSessions);

      const result = await GetUserSessionsService({ userId });

      expect(result).toEqual(mockSessions);
      expect(prisma.sessions.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: {
          created_at: "desc"
        }
      });
    });

    // Test 2: Throw when no sessions found
    it("should throw when no sessions are found", async () => {
      prisma.sessions.findMany.mockResolvedValue([]);

      await expect(GetUserSessionsService({ userId })).rejects.toThrow(ApiError);
      await expect(GetUserSessionsService({ userId })).rejects.toThrow(
        "No sessions found for this user"
      );
    });

    // Test 3: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.sessions.findMany.mockRejectedValue(dbError);

      await expect(GetUserSessionsService({ userId })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  // ============================================================
  // REVOKE SESSION SERVICE TESTS
  // ============================================================
  describe("RevokeSessionService", () => {
    const userId = "user_123";
    const sessionId = "session_123";
    const mockSession = {
      id: sessionId,
      user_id: userId,
      is_active: true,
      expires_at: new Date(Date.now() + 86400000)
    };

    // Test 1: Happy Path
    it("should revoke session successfully", async () => {
      prisma.sessions.findUnique.mockResolvedValue(mockSession);
      prisma.sessions.update.mockResolvedValue({ ...mockSession, is_active: false });

      const result = await RevokeSessionService({ userId, sessionId });

      expect(result).toBe(true);
      expect(prisma.sessions.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId }
      });
      expect(prisma.sessions.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { is_active: false }
      });
    });

    // Test 2: Throw when session does not exist
    it("should throw when session does not exist", async () => {
      prisma.sessions.findUnique.mockResolvedValue(null);

      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(ApiError);
      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(
        "Session not found"
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 3: Throw when session belongs to another user
    it("should throw when session belongs to another user", async () => {
      const anotherUserSession = {
        ...mockSession,
        user_id: "another_user"
      };
      prisma.sessions.findUnique.mockResolvedValue(anotherUserSession);

      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(ApiError);
      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(
        "Session not found"
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 4: Throw when session is already inactive
    it("should throw when session is already inactive", async () => {
      const inactiveSession = {
        ...mockSession,
        is_active: false
      };
      prisma.sessions.findUnique.mockResolvedValue(inactiveSession);

      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(ApiError);
      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(
        "Session is already inactive"
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 5: Throw when session is expired
    it("should throw when session is expired", async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 86400000)
      };
      prisma.sessions.findUnique.mockResolvedValue(expiredSession);

      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(ApiError);
      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(
        "Session is already expired"
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 6: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.sessions.findUnique.mockRejectedValue(dbError);

      await expect(RevokeSessionService({ userId, sessionId })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  // ============================================================
  // REVOKE ALL SESSIONS SERVICE TESTS
  // ============================================================
  describe("RevokeAllSessionsService", () => {
    const userId = "user_123";
    const mockUser = {
      id: userId,
      email: "test@example.com"
    };
    const mockActiveSessions = [
      {
        id: "session_1",
        user_id: userId,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000)
      },
      {
        id: "session_2",
        user_id: userId,
        is_active: true,
        expires_at: new Date(Date.now() + 7200000)
      }
    ];

    // Test 1: Happy Path
    it("should revoke all active sessions successfully", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.sessions.findMany.mockResolvedValue(mockActiveSessions);
      ExpireUserSessions.mockResolvedValue(true);

      const result = await RevokeAllSessionsService({ userId });

      expect(result).toBe(true);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(prisma.sessions.findMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: {
            gt: expect.any(Date)
          }
        }
      });
      expect(ExpireUserSessions).toHaveBeenCalledWith(userId);
    });

    // Test 2: Throw when user does not exist
    it("should throw when user does not exist", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(ApiError);
      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(
        "User not found"
      );
      expect(prisma.sessions.findMany).not.toHaveBeenCalled();
      expect(ExpireUserSessions).not.toHaveBeenCalled();
    });

    // Test 3: Throw when no active sessions exist
    it("should throw when no active sessions exist", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.sessions.findMany.mockResolvedValue([]);

      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(ApiError);
      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(
        "No active sessions found for this user"
      );
      expect(ExpireUserSessions).not.toHaveBeenCalled();
    });

    // Test 4: Call ExpireUserSessions with correct userId
    it("should call ExpireUserSessions with correct userId", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.sessions.findMany.mockResolvedValue(mockActiveSessions);
      ExpireUserSessions.mockResolvedValue(true);

      await RevokeAllSessionsService({ userId });

      expect(ExpireUserSessions).toHaveBeenCalledWith(userId);
      expect(ExpireUserSessions).toHaveBeenCalledTimes(1);
    });

    // Test 5: Propagate prisma/utility errors
    it("should propagate prisma/utility errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.users.findUnique.mockRejectedValue(dbError);

      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(
        "Database connection failed"
      );
    });

    // Test 6: Propagate ExpireUserSessions errors
    it("should propagate ExpireUserSessions errors", async () => {
      const utilityError = new Error("Session expiration failed");
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.sessions.findMany.mockResolvedValue(mockActiveSessions);
      ExpireUserSessions.mockRejectedValue(utilityError);

      await expect(RevokeAllSessionsService({ userId })).rejects.toThrow(
        "Session expiration failed"
      );
    });
  });
});