import { jest } from "@jest/globals";

// Mock logger
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  default: {
    error: jest.fn(),
  },
}));

// Dynamic imports
const logger = (await import("../../../src/config/logger.js")).default;
const { GlobalErrorHandler } =
  await import("../../../src/middlewares/ErrorMiddleware.js");

describe("GlobalErrorHandler", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      originalUrl: "/api/test",
      method: "GET",
      ip: "192.168.1.1",
      user: {
        id: "user_123",
      },
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should return status code from error
  // ============================================================
  it("should return status code from error", () => {
    const error = new Error("Bad Request");
    error.statusCode = 400;

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  // ============================================================
  // TEST 2: Should return 500 when no status code in error
  // ============================================================
  it("should return 500 when no status code in error", () => {
    const error = new Error("Internal Error");

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  // ============================================================
  // TEST 3: Should return error message in response
  // ============================================================
  it("should return error message in response", () => {
    const error = new Error("Validation failed");
    error.statusCode = 422;

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation failed",
      }),
    );
  });

  // ============================================================
  // TEST 4: Should return default message when no error message
  // ============================================================
  it("should return default message when no error message", () => {
    const error = new Error();
    error.statusCode = 500;

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Internal Server Error",
      }),
    );
  });

  // ============================================================
  // TEST 5: Should log error with correct structure
  // ============================================================
  it("should log error with correct structure", () => {
    const error = new Error("Database error");
    error.statusCode = 500;
    error.stack = "Error stack trace";

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Database error",
        stack: expect.any(String),
        route: "/api/test",
        method: "GET",
        ip: "192.168.1.1",
        userId: "user_123",
      }),
    );
  });

  // ============================================================
  // TEST 6: Should handle missing user info in request
  // ============================================================
  it("should handle missing user info in request", () => {
    mockReq.user = undefined;
    const error = new Error("Unauthorized");
    error.statusCode = 401;

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
      }),
    );
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  // ============================================================
  // TEST 10: Should call res.status and res.json
  // ============================================================
  it("should call res.status and res.json", () => {
    const error = new Error("Error");
    error.statusCode = 500;

    GlobalErrorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalled();
  });
});
