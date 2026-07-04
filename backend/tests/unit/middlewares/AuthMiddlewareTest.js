import { jest } from "@jest/globals";

// Mock jwt utils
jest.unstable_mockModule("../../../src/utils/jwt.js", () => ({
  verifyToken: jest.fn()
}));


// Dynamic imports
const { verifyToken } = await import("../../../src/utils/jwt.js");
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { AuthMiddleware } = await import("../../../src/middlewares/AuthMiddleware.js");

describe("AuthMiddleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should call next() when valid token is provided
  // ============================================================
  it("should call next() when valid token is provided", () => {
    const validToken = "valid.jwt.token";
    const decodedPayload = { 
      userId: "user_123", 
      role: "Member" 
    };
    
    mockReq.headers.authorization = `Bearer ${validToken}`;
    verifyToken.mockReturnValue(decodedPayload);

    AuthMiddleware(mockReq, mockRes, mockNext);

    expect(verifyToken).toHaveBeenCalledWith(validToken);
    expect(mockReq.user).toEqual(decodedPayload);
    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // TEST 2: Should throw error when no token is provided
  // ============================================================
  it("should throw ApiError when no token is provided", () => {
    mockReq.headers = {};

    expect(() => AuthMiddleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    expect(verifyToken).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

 

  // ============================================================
  // TEST 4: Should call next with error when token is invalid
  // ============================================================
  it("should call next with ApiError when token is invalid", () => {
    const invalidToken = "invalid.jwt.token";
    
    mockReq.headers.authorization = `Bearer ${invalidToken}`;
    verifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    AuthMiddleware(mockReq, mockRes, mockNext);

    expect(verifyToken).toHaveBeenCalledWith(invalidToken);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    expect(mockReq.user).toBeNull();
  });

  // ============================================================
  // TEST 5: Should call next with error when token is expired
  // ============================================================
  it("should call next with ApiError when token is expired", () => {
    const expiredToken = "expired.jwt.token";
    
    mockReq.headers.authorization = `Bearer ${expiredToken}`;
    verifyToken.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    AuthMiddleware(mockReq, mockRes, mockNext);

    expect(verifyToken).toHaveBeenCalledWith(expiredToken);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
  });

  // ============================================================
  // TEST 6: Should wrap any error in ApiError
  // ============================================================
  it("should wrap any error in ApiError", () => {
    const invalidToken = "invalid.jwt.token";
    
    mockReq.headers.authorization = `Bearer ${invalidToken}`;
    verifyToken.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    AuthMiddleware(mockReq, mockRes, mockNext);

    const errorArg = mockNext.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(ApiError);
    expect(errorArg.statusCode).toBe(401);
  });

});