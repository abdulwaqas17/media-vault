import { jest } from "@jest/globals";

jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
        sign: jest.fn(),
        verify: jest.fn(),
    },
}));

const jwt = (await import("jsonwebtoken")).default;
const { sign, verify } = jwt;

const {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
} = await import("../../../src/utils/jwt.js");

const env = (await import("../../../src/config/env.js")).default;
const { ApiError } = await import("../../../src/utils/ApiError.js");

describe("JWT Utils", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: generateAccessToken - Happy Path
  // ============================================================
  it("should generate access token with correct payload and options", () => {
    const payload = { userId: "user_123", role: "Member", sessionId: "session_123" };
    const mockToken = "mock_access_token_123";
    
    sign.mockReturnValue(mockToken);
    
    const token = generateAccessToken(payload);
    
    expect(sign).toHaveBeenCalledWith(
      payload,
      env.JWT_SECRET,
      { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN }
    );
    expect(token).toBe(mockToken);
  });

  // ============================================================
  // TEST 2: generateRefreshToken - Happy Path
  // ============================================================
  it("should generate refresh token with correct payload and options", () => {
    const payload = { userId: "user_123" };
    const mockToken = "mock_refresh_token_123";
    
    sign.mockReturnValue(mockToken);
    
    const token = generateRefreshToken(payload);
    
    expect(sign).toHaveBeenCalledWith(
      payload,
      env.JWT_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
    );
    expect(token).toBe(mockToken);
  });

  // ============================================================
  // TEST 3: verifyToken - Valid Token
  // ============================================================
  it("should return decoded payload for valid token", () => {
    const mockDecoded = { userId: "user_123", role: "Member" };
    const token = "valid_token_123";
    
    verify.mockReturnValue(mockDecoded);
    
    const result = verifyToken(token);
    
    expect(verify).toHaveBeenCalledWith(token, env.JWT_SECRET);
    expect(result).toEqual(mockDecoded);
  });

  // ============================================================
  // TEST 4: verifyToken - Invalid Token
  // ============================================================
  it("should throw ApiError for invalid token", () => {
    const token = "invalid_token_123";
    
    verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });
    
    expect(() => verifyToken(token)).toThrow(ApiError);
    expect(() => verifyToken(token)).toThrow("Invalid or expired token");
  });

  // ============================================================
  // TEST 5: verifyToken - Expired Token
  // ============================================================
  it("should throw ApiError for expired token", () => {
    const token = "expired_token_123";
    
    verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });
    
    expect(() => verifyToken(token)).toThrow(ApiError);
    expect(() => verifyToken(token)).toThrow("Invalid or expired token");
  });
});