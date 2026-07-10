import { jest } from "@jest/globals";

// Mock SessionService
jest.unstable_mockModule("../../../src/modules/session/SessionService.js", () => ({
  GetUserSessionsService: jest.fn(),
  RevokeSessionService: jest.fn(),
  RevokeAllSessionsService: jest.fn()
}));

// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn()
}));

// Dynamic imports
const {
  GetUserSessionsService,
  RevokeSessionService,
  RevokeAllSessionsService
} = await import("../../../src/modules/session/SessionService.js");

const { SendResponse } = await import("../../../src/utils/ApiResponse.js");

const {
  GetUserSessionsController,
  RevokeSessionController,
  RevokeAllSessionsController
} = await import("../../../src/modules/session/SessionController.js");

describe("SessionController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {}
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // GET USER SESSIONS CONTROLLER TESTS
  // ============================================================
  describe("GetUserSessionsController", () => {
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

    beforeEach(() => {
      mockReq.params.userId = userId;
    });

    // Test 1: Happy Path
    it("should call GetUserSessionsService with userId and return success response", async () => {
      GetUserSessionsService.mockResolvedValue(mockSessions);
      SendResponse.mockReturnValue();

      await GetUserSessionsController(mockReq, mockRes, mockNext);

      expect(GetUserSessionsService).toHaveBeenCalledWith({
        userId: userId
      });
      expect(GetUserSessionsService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "User sessions fetched successfully",
        mockSessions
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("No sessions found for this user");
      GetUserSessionsService.mockRejectedValue(error);

      await GetUserSessionsController(mockReq, mockRes, mockNext);

      expect(GetUserSessionsService).toHaveBeenCalledWith({
        userId: userId
      });
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // REVOKE SESSION CONTROLLER TESTS
  // ============================================================
  describe("RevokeSessionController", () => {
    const userId = "user_123";
    const sessionId = "session_456";

    beforeEach(() => {
      mockReq.params.userId = userId;
      mockReq.params.sessionId = sessionId;
    });

    // Test 1: Happy Path
    it("should call RevokeSessionService with userId and sessionId and return success response", async () => {
      RevokeSessionService.mockResolvedValue(true);
      SendResponse.mockReturnValue();

      await RevokeSessionController(mockReq, mockRes, mockNext);

      expect(RevokeSessionService).toHaveBeenCalledWith({
        userId: userId,
        sessionId: sessionId
      });
      expect(RevokeSessionService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Session revoked successfully"
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Session not found");
      RevokeSessionService.mockRejectedValue(error);

      await RevokeSessionController(mockReq, mockRes, mockNext);

      expect(RevokeSessionService).toHaveBeenCalledWith({
        userId: userId,
        sessionId: sessionId
      });
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // REVOKE ALL SESSIONS CONTROLLER TESTS
  // ============================================================
  describe("RevokeAllSessionsController", () => {
    const userId = "user_123";

    beforeEach(() => {
      mockReq.params.userId = userId;
    });

    // Test 1: Happy Path
    it("should call RevokeAllSessionsService with userId and return success response", async () => {
      RevokeAllSessionsService.mockResolvedValue(true);
      SendResponse.mockReturnValue();

      await RevokeAllSessionsController(mockReq, mockRes, mockNext);

      expect(RevokeAllSessionsService).toHaveBeenCalledWith({
        userId: userId
      });
      expect(RevokeAllSessionsService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "All sessions revoked successfully"
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("No active sessions found for this user");
      RevokeAllSessionsService.mockRejectedValue(error);

      await RevokeAllSessionsController(mockReq, mockRes, mockNext);

      expect(RevokeAllSessionsService).toHaveBeenCalledWith({
        userId: userId
      });
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});