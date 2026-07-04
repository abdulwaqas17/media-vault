import { jest } from "@jest/globals";
import { RateLimitHandler } from "../../../src/utils/RateLimitHandler.js";

describe("RateLimitHandler", () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockOptions;

  beforeEach(() => {
    // Mock request object
    mockReq = {
      ip: "192.168.1.1",
      rateLimit: {
        resetTime: new Date(Date.now() + 30000) // 30 seconds from now
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock options
    mockOptions = {
      statusCode: 429
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should return 429 status code
  // ============================================================
  it("should return 429 status code when rate limit is hit", () => {
    const handler = RateLimitHandler();
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  // ============================================================
  // TEST 2: Should return correct response structure
  // ============================================================
  it("should return response with success: false", () => {
    const handler = RateLimitHandler();
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
        retryAfter: expect.any(String)
      })
    );
  });

  // ============================================================
  // TEST 3: Should calculate correct retry time
  // ============================================================
  it("should calculate correct retry after seconds", () => {
    const handler = RateLimitHandler();
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    const callArgs = mockRes.json.mock.calls[0][0];
    expect(callArgs.retryAfter).toMatch(/\d+ seconds/);
    expect(parseInt(callArgs.retryAfter)).toBeGreaterThan(0);
  });

  // ============================================================
  // TEST 4: Should use custom message when provided
  // ============================================================
  it("should use custom message when provided", () => {
    const customMessage = "Please slow down. You are making too many requests.";
    const handler = RateLimitHandler(customMessage);
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    const callArgs = mockRes.json.mock.calls[0][0];
    expect(callArgs.message).toBe(customMessage);
  });

  // ============================================================
  // TEST 5: Should use default message when no custom message provided
  // ============================================================
  it("should use default message when no custom message provided", () => {
    const defaultMessage = "Too many requests. Please try again later.";
    const handler = RateLimitHandler();
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    const callArgs = mockRes.json.mock.calls[0][0];
    expect(callArgs.message).toBe(defaultMessage);
  });

  // ============================================================
  // TEST 6: Should handle zero remaining time
  // ============================================================
  it("should handle when reset time is in the past", () => {
    mockReq.rateLimit.resetTime = new Date(Date.now() - 5000); // 5 seconds ago
    
    const handler = RateLimitHandler();
    
    handler(mockReq, mockRes, mockNext, mockOptions);
    
    const callArgs = mockRes.json.mock.calls[0][0];
    expect(parseInt(callArgs.retryAfter)).toBeLessThanOrEqual(0);
  });

});