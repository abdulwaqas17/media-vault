import { jest } from "@jest/globals";

// Mock AuthService
jest.unstable_mockModule("../../../src/modules/auth/AuthService.js", () => ({
  SignupService: jest.fn(),
  GoogleAuthService: jest.fn(),
  LoginService: jest.fn(),
  RefreshTokenService: jest.fn(),
  LogoutService: jest.fn()
}));


// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn()
}));

// Dynamic imports
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { SendResponse } = await import("../../../src/utils/ApiResponse.js");
const {
  SignupService,
  GoogleAuthService,
  LoginService,
  RefreshTokenService,
  LogoutService
} = await import("../../../src/modules/auth/AuthService.js");

const {
  SignupController,
  GoogleAuthController,
  LoginController,
  RefreshTokenController,
  LogoutController
} = await import("../../../src/modules/auth/AuthController.js");

describe("AuthController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {
        "user-agent": "Mozilla/5.0"
      },
      ip: "192.168.1.1",
      cookies: {},
      user: {}
    };

    mockRes = {
      cookie: jest.fn()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // SIGNUP CONTROLLER TESTS
  // ============================================================
  describe("SignupController", () => {
    const signupData = {
      email: "test@example.com",
      password: "Password123",
      full_name: "Test User"
    };

    const mockResult = {
      user: { id: "user_123", email: "test@example.com" },
      accessToken: "mock.access.token",
      refreshToken: "mock.refresh.token"
    };

    beforeEach(() => {
      mockReq.body = signupData;
    });

    // Test 1: Happy Path
    it("should call SignupService with request data and return success response", async () => {
      SignupService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await SignupController(mockReq, mockRes, mockNext);

      expect(SignupService).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        full_name: signupData.full_name,
        userAgent: mockReq.headers["user-agent"],
        ipAddress: mockReq.ip
      });
      expect(SignupService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        201,
        "Signup successful",
        {
          user: mockResult.user,
          accessToken: mockResult.accessToken
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should set refresh token cookie
    it("should set refresh token cookie after successful signup", async () => {
      SignupService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await SignupController(mockReq, mockRes, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "refreshToken",
        mockResult.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        }
      );
      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
    });

    // Test 3: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Email already exists");
      SignupService.mockRejectedValue(error);

      await SignupController(mockReq, mockRes, mockNext);

      expect(SignupService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // GOOGLE AUTH CONTROLLER TESTS
  // ============================================================
  describe("GoogleAuthController", () => {
    const googleData = {
      idToken: "mock.google.id.token"
    };

    const mockResult = {
      user: { id: "user_123", email: "google@example.com" },
      accessToken: "mock.access.token",
      refreshToken: "mock.refresh.token"
    };

    beforeEach(() => {
      mockReq.body = googleData;
    });

    // Test 1: Happy Path
    it("should call GoogleAuthService with request data and return success response", async () => {
      GoogleAuthService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GoogleAuthController(mockReq, mockRes, mockNext);

      expect(GoogleAuthService).toHaveBeenCalledWith({
        idToken: googleData.idToken,
        userAgent: mockReq.headers["user-agent"],
        ipAddress: mockReq.ip
      });
      expect(GoogleAuthService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Google authentication successful",
        {
          user: mockResult.user,
          accessToken: mockResult.accessToken
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should set refresh token cookie
    it("should set refresh token cookie after successful authentication", async () => {
      GoogleAuthService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GoogleAuthController(mockReq, mockRes, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "refreshToken",
        mockResult.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        }
      );
      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
    });

    // Test 3: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Invalid Google token");
      GoogleAuthService.mockRejectedValue(error);

      await GoogleAuthController(mockReq, mockRes, mockNext);

      expect(GoogleAuthService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // LOGIN CONTROLLER TESTS
  // ============================================================
  describe("LoginController", () => {
    const loginData = {
      email: "test@example.com",
      password: "Password123"
    };

    const mockResult = {
      user: { id: "user_123", email: "test@example.com" },
      accessToken: "mock.access.token",
      refreshToken: "mock.refresh.token"
    };

    beforeEach(() => {
      mockReq.body = loginData;
    });

    // Test 1: Happy Path
    it("should call LoginService with request data and return success response", async () => {
      LoginService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await LoginController(mockReq, mockRes, mockNext);

      expect(LoginService).toHaveBeenCalledWith({
        email: loginData.email,
        password: loginData.password,
        userAgent: mockReq.headers["user-agent"],
        ipAddress: mockReq.ip
      });
      expect(LoginService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Login successful",
        {
          user: mockResult.user,
          accessToken: mockResult.accessToken
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should set refresh token cookie
    it("should set refresh token cookie after successful login", async () => {
      LoginService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await LoginController(mockReq, mockRes, mockNext);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "refreshToken",
        mockResult.refreshToken,
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        }
      );
      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
    });

    // Test 3: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Invalid credentials");
      LoginService.mockRejectedValue(error);

      await LoginController(mockReq, mockRes, mockNext);

      expect(LoginService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // REFRESH TOKEN CONTROLLER TESTS
  // ============================================================
  describe("RefreshTokenController", () => {
    const mockAccessToken = "mock.access.token";
    const mockRefreshToken = "mock.refresh.token";
    const mockResult = {
      accessToken: "new.mock.access.token"
    };

    beforeEach(() => {
      mockReq.headers.authorization = `Bearer ${mockAccessToken}`;
      mockReq.cookies.refreshToken = mockRefreshToken;
    });

    // Test 1: Should throw when access token is missing
    it("should throw when access token is missing", async () => {
      mockReq.headers.authorization = undefined;

      await RefreshTokenController(mockReq, mockRes, mockNext);

      expect(RefreshTokenService).not.toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access token is missing",
          statusCode: 401
        })
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    // Test 2: Should throw when refresh token is missing
    it("should throw when refresh token is missing", async () => {
      mockReq.cookies.refreshToken = undefined;

      await RefreshTokenController(mockReq, mockRes, mockNext);

      expect(RefreshTokenService).not.toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Refresh token is missing",
          statusCode: 401
        })
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    // Test 3: Should call RefreshTokenService with access token and refresh token
    it("should call RefreshTokenService with access token and refresh token", async () => {
      RefreshTokenService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await RefreshTokenController(mockReq, mockRes, mockNext);

      expect(RefreshTokenService).toHaveBeenCalledWith({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });
      expect(RefreshTokenService).toHaveBeenCalledTimes(1);
    });

    // Test 4: Should return refreshed access token successfully
    it("should return refreshed access token successfully", async () => {
      RefreshTokenService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await RefreshTokenController(mockReq, mockRes, mockNext);

      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Access token refreshed successfully",
        mockResult
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 5: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Invalid refresh token");
      RefreshTokenService.mockRejectedValue(error);

      await RefreshTokenController(mockReq, mockRes, mockNext);

      expect(RefreshTokenService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // LOGOUT CONTROLLER TESTS
  // ============================================================
  describe("LogoutController", () => {
    const mockSessionId = "session_123";

    beforeEach(() => {
      mockReq.user = {
        sessionId: mockSessionId
      };
    });

    // Test 1: Happy Path
    it("should call LogoutService with sessionId and return success response", async () => {
      LogoutService.mockResolvedValue(true);
      SendResponse.mockReturnValue();

      await LogoutController(mockReq, mockRes, mockNext);

      expect(LogoutService).toHaveBeenCalledWith({
        sessionId: mockSessionId
      });
      expect(LogoutService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Logged out successfully"
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("Session not found");
      LogoutService.mockRejectedValue(error);

      await LogoutController(mockReq, mockRes, mockNext);

      expect(LogoutService).toHaveBeenCalledWith({
        sessionId: mockSessionId
      });
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});