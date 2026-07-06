import { jest } from "@jest/globals";

// Mock bcryptjs - CORRECT WAY
jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    roles: {
      findUnique: jest.fn(),
    },
    sessions: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock jwt utils
jest.unstable_mockModule("../../../src/utils/jwt.js", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

// Mock jsonwebtoken
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    decode: jest.fn(),
  },
}));

// Mock google-auth-library
jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));


// Mock constants
jest.unstable_mockModule("../../../src/constants/constants.js", () => ({
  Provider: {
    Local: "Local",
    Google: "Google",
  },
  ROLES: {
    Member: "Member",
  },
  UserStatus: {
    Active: "Active",
    Inactive: "Inactive",
  },
}));

// Mock env
jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    GOOGLE_CLIENT_ID: "test-google-client-id",
  },
}));

// Dynamic imports - CORRECT WAY
const bcrypt = (await import("bcryptjs")).default;
const prisma = (await import("../../../src/config/prisma.js")).default;
const { generateAccessToken, generateRefreshToken } =
  await import("../../../src/utils/jwt.js");
const jwt = (await import("jsonwebtoken")).default;
const { OAuth2Client } = await import("google-auth-library");
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { Provider, ROLES, UserStatus } =
  await import("../../../src/constants/constants.js");
const env = (await import("../../../src/config/env.js")).default;

const {
  SignupService,
  GoogleAuthService,
  LoginService,
  RefreshTokenService,
  LogoutService,
} = await import("../../../src/modules/auth/AuthService.js");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // SIGNUP SERVICE TESTS
  // ============================================================
  describe("SignupService", () => {
    const signupData = {
      email: "test@example.com",
      password: "Password123",
      full_name: "Test User",
      userAgent: "Mozilla/5.0",
      ipAddress: "192.168.1.1",
    };

    const mockRole = { id: "role_123", name: "Member" };
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      password: "hashedPassword",
      provider: "Local",
      role: mockRole,
      profile: { full_name: "Test User" },
    };
    const mockSession = { id: "session_123" };
    const mockAccessToken = "mock.access.token";
    const mockRefreshToken = "mock.refresh.token";

    // Test 1: Happy Path
    it("should signup user successfully and return user + tokens", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      const result = await SignupService(signupData);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: signupData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(prisma.roles.findUnique).toHaveBeenCalledWith({
        where: { name: ROLES.Member },
      });
    });

    // Test 2: Email already exists
    it("should throw error if email already exists", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);

      await expect(SignupService(signupData)).rejects.toThrow(ApiError);
      await expect(SignupService(signupData)).rejects.toThrow(
        "Email already exists",
      );
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    // Test 3: Default role not found
    it("should throw error if default role is not found", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      prisma.roles.findUnique.mockResolvedValue(null);

      await expect(SignupService(signupData)).rejects.toThrow(ApiError);
      await expect(SignupService(signupData)).rejects.toThrow(
        "Default role not found",
      );
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    // Test 4: Hash password before saving
    it("should hash password before saving user", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      // Pehli call password hash return kare
      bcrypt.hash.mockResolvedValueOnce("hashedPassword");
      // Dosri call refresh token hash return kare
      bcrypt.hash.mockResolvedValueOnce("hashedRefreshToken");

      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await SignupService(signupData);

      // Verify first hash call is for password
      expect(bcrypt.hash).toHaveBeenNthCalledWith(1, signupData.password, 10);

      // Verify second hash call is for refresh token
      expect(bcrypt.hash).toHaveBeenNthCalledWith(2, mockRefreshToken, 10);

      // Verify user create data contains hashed password
      const createCallArgs = prisma.users.create.mock.calls[0][0];
      expect(createCallArgs.data.password).toBe("hashedPassword");
    });

    // Test 5: Create session after user creation
    it("should create session after user creation", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await SignupService(signupData);

      expect(prisma.sessions.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          refresh_token: "hashedRefreshToken",
          user_agent: signupData.userAgent,
          ip_address: signupData.ipAddress,
          expires_at: expect.any(Date),
        },
      });
    });

    // Test 6: Generate access token with correct payload
    it("should generate access token with correct payload", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await SignupService(signupData);

      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role.name,
        sessionId: mockSession.id,
      });
    });

    // Test 7: Generate refresh token
    it("should generate refresh token", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await SignupService(signupData);

      expect(generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });

    // Test 8: Propagate Prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.users.findUnique.mockRejectedValue(dbError);

      await expect(SignupService(signupData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  // ============================================================
  // GOOGLE AUTH SERVICE TESTS
  // ============================================================
  describe("GoogleAuthService", () => {
    const googleData = {
      idToken: "mock.google.id.token",
      userAgent: "Mozilla/5.0",
      ipAddress: "192.168.1.1",
    };

    const mockGooglePayload = {
      email: "google@example.com",
      name: "Google User",
    };

    const mockRole = { id: "role_123", name: "Member" };
    const mockUser = {
      id: "user_123",
      email: "google@example.com",
      provider: "Google",
      status: "Active",
      role: mockRole,
      profile: { full_name: "Google User" },
    };
    const mockSession = { id: "session_123" };
    const mockAccessToken = "mock.access.token";
    const mockRefreshToken = "mock.refresh.token";

    let mockVerifyIdToken;

    beforeEach(() => {
      mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => mockGooglePayload,
      });
      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));
    });

    // Test 1: Login existing google user
    it("should login existing google user successfully", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      const result = await GoogleAuthService(googleData);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: googleData.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: mockGooglePayload.email },
        include: { role: true, profile: true },
      });
    });

    // Test 2: Create new google user
    it("should create new google user if user does not exist", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      prisma.roles.findUnique.mockResolvedValue(mockRole);
      prisma.users.create.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      const result = await GoogleAuthService(googleData);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: {
          email: mockGooglePayload.email,
          provider: Provider.Google,
          role: { connect: { id: mockRole.id } },
          profile: { create: { full_name: mockGooglePayload.name } },
        },
        include: { role: true, profile: true },
      });
    });

    // Test 3: Throw error when google email is missing
    it("should throw error when google email is missing", async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ name: "No Email" }),
      });

      await expect(GoogleAuthService(googleData)).rejects.toThrow(ApiError);
      await expect(GoogleAuthService(googleData)).rejects.toThrow(
        "Google account email not found",
      );
    });

    // Test 4: Throw error if default role is missing
    it("should throw error if default role is missing", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      prisma.roles.findUnique.mockResolvedValue(null);

      await expect(GoogleAuthService(googleData)).rejects.toThrow(ApiError);
      await expect(GoogleAuthService(googleData)).rejects.toThrow(
        "Default role not found",
      );
    });

    // Test 5: Throw error when user is inactive
    it("should throw error when user is inactive", async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.Inactive };
      prisma.users.findUnique.mockResolvedValue(inactiveUser);

      await expect(GoogleAuthService(googleData)).rejects.toThrow(ApiError);
      await expect(GoogleAuthService(googleData)).rejects.toThrow(
        "Your account is Inactive",
      );
    });

    // Test 6: Verify google id token
    it("should verify google id token", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await GoogleAuthService(googleData);

      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: googleData.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    });

    // Test 7: Create session and generate tokens
    it("should create session and generate tokens", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await GoogleAuthService(googleData);

      expect(prisma.sessions.create).toHaveBeenCalled();
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role.name,
        sessionId: mockSession.id,
      });
      expect(generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });

    // Test 8: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.users.findUnique.mockRejectedValue(dbError);

      await expect(GoogleAuthService(googleData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  // ============================================================
  // LOGIN SERVICE TESTS
  // ============================================================
  describe("LoginService", () => {
    const loginData = {
      email: "test@example.com",
      password: "Password123",
      userAgent: "Mozilla/5.0",
      ipAddress: "192.168.1.1",
    };

    const mockRole = { id: "role_123", name: "Member" };
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      password: "hashedPassword",
      provider: "Local",
      status: "Active",
      role: mockRole,
      profile: { full_name: "Test User" },
    };
    const mockSession = { id: "session_123" };
    const mockAccessToken = "mock.access.token";
    const mockRefreshToken = "mock.refresh.token";

    // Test 1: Happy Path
    it("should login successfully", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      const result = await LoginService(loginData);

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
        include: { role: true, profile: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password,
      );
    });

    // Test 2: Throw if user not found
    it("should throw if user not found", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(LoginService(loginData)).rejects.toThrow(ApiError);
      await expect(LoginService(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    // Test 3: Throw if user inactive
    it("should throw if user inactive", async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.Inactive };
      prisma.users.findUnique.mockResolvedValue(inactiveUser);

      await expect(LoginService(loginData)).rejects.toThrow(ApiError);
      await expect(LoginService(loginData)).rejects.toThrow(
        "Your account is Inactive",
      );
    });

    // Test 4: Throw if google account tries password login
    it("should throw if google account tries password login", async () => {
      const googleUser = { ...mockUser, provider: "Google", password: null };
      prisma.users.findUnique.mockResolvedValue(googleUser);

      await expect(LoginService(loginData)).rejects.toThrow(ApiError);
      await expect(LoginService(loginData)).rejects.toThrow(
        "Please login using Google",
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    // Test 5: Throw if password is incorrect
    it("should throw if password is incorrect", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(LoginService(loginData)).rejects.toThrow(ApiError);
      await expect(LoginService(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
    });

    // Test 6: Create session
    it("should create session", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await LoginService(loginData);

      expect(prisma.sessions.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          refresh_token: "hashedRefreshToken",
          user_agent: loginData.userAgent,
          ip_address: loginData.ipAddress,
          expires_at: expect.any(Date),
        },
      });
    });

    // Test 7: Generate access and refresh token
    it("should generate access and refresh token", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateRefreshToken.mockReturnValue(mockRefreshToken);
      bcrypt.hash.mockResolvedValue("hashedRefreshToken");
      prisma.sessions.create.mockResolvedValue(mockSession);
      generateAccessToken.mockReturnValue(mockAccessToken);

      await LoginService(loginData);

      expect(generateRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role.name,
        sessionId: mockSession.id,
      });
    });

    // Test 8: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.users.findUnique.mockRejectedValue(dbError);

      await expect(LoginService(loginData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  // ============================================================
  // REFRESH TOKEN SERVICE TESTS
  // ============================================================
  describe("RefreshTokenService", () => {
    const refreshData = {
      accessToken: "mock.access.token",
      refreshToken: "mock.refresh.token",
    };

    const mockDecoded = { sessionId: "session_123" };
    const mockSession = {
      id: "session_123",
      is_active: true,
      expires_at: new Date(Date.now() + 86400000),
      refresh_token: "hashedRefreshToken",
      user: {
        id: "user_123",
        status: "Active",
        role: { name: "Member" },
      },
    };
    const mockNewAccessToken = "new.mock.access.token";

    // Test 1: Happy Path
    it("should return new access token", async () => {
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(mockSession);
      bcrypt.compare.mockResolvedValue(true);
      generateAccessToken.mockReturnValue(mockNewAccessToken);

      const result = await RefreshTokenService(refreshData);

      expect(result).toEqual({ accessToken: mockNewAccessToken });
      expect(jwt.decode).toHaveBeenCalledWith(refreshData.accessToken);
      expect(prisma.sessions.findUnique).toHaveBeenCalledWith({
        where: { id: mockDecoded.sessionId },
        include: {
          user: {
            include: { role: true },
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        refreshData.refreshToken,
        mockSession.refresh_token,
      );
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockSession.user.id,
        role: mockSession.user.role.name,
        sessionId: mockSession.id,
      });
    });

    // Test 2: Throw if access token is invalid
    it("should throw if access token is invalid", async () => {
      jwt.decode.mockReturnValue(null);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Invalid access token",
      );
      expect(prisma.sessions.findUnique).not.toHaveBeenCalled();
    });

    // Test 3: Throw if session not found
    it("should throw if session not found", async () => {
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(null);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Session not found",
      );
    });

    // Test 4: Throw if session inactive
    it("should throw if session inactive", async () => {
      const inactiveSession = { ...mockSession, is_active: false };
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(inactiveSession);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Session inactive",
      );
    });

    // Test 5: Throw if session expired
    it("should throw if session expired", async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 86400000),
      };
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(expiredSession);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Session expired",
      );
    });

    // Test 6: Throw if refresh token mismatch
    it("should throw if refresh token mismatch", async () => {
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(mockSession);
      bcrypt.compare.mockResolvedValue(false);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Invalid refresh token",
      );
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    // Test 7: Throw if user inactive
    it("should throw if user inactive", async () => {
      const inactiveUserSession = {
        ...mockSession,
        user: { ...mockSession.user, status: "Inactive" },
      };
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockResolvedValue(inactiveUserSession);
      bcrypt.compare.mockResolvedValue(true);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(ApiError);
      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "User inactive",
      );
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    // Test 8: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      jwt.decode.mockReturnValue(mockDecoded);
      prisma.sessions.findUnique.mockRejectedValue(dbError);

      await expect(RefreshTokenService(refreshData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  // ============================================================
  // LOGOUT SERVICE TESTS
  // ============================================================
  describe("LogoutService", () => {
    const logoutData = { sessionId: "session_123" };
    const mockSession = {
      id: "session_123",
      is_active: true,
    };

    // Test 1: Happy Path
    it("should logout successfully", async () => {
      prisma.sessions.findUnique.mockResolvedValue(mockSession);
      prisma.sessions.update.mockResolvedValue({
        ...mockSession,
        is_active: false,
      });

      const result = await LogoutService(logoutData);

      expect(result).toBe(true);
      expect(prisma.sessions.findUnique).toHaveBeenCalledWith({
        where: { id: logoutData.sessionId },
      });
      expect(prisma.sessions.update).toHaveBeenCalledWith({
        where: { id: logoutData.sessionId },
        data: { is_active: false },
      });
    });

    // Test 2: Throw if session not found
    it("should throw if session not found", async () => {
      prisma.sessions.findUnique.mockResolvedValue(null);

      await expect(LogoutService(logoutData)).rejects.toThrow(ApiError);
      await expect(LogoutService(logoutData)).rejects.toThrow(
        "Session not found",
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 3: Throw if session already inactive
    it("should throw if session already inactive", async () => {
      const inactiveSession = { ...mockSession, is_active: false };
      prisma.sessions.findUnique.mockResolvedValue(inactiveSession);

      await expect(LogoutService(logoutData)).rejects.toThrow(ApiError);
      await expect(LogoutService(logoutData)).rejects.toThrow(
        "Session already logged out",
      );
      expect(prisma.sessions.update).not.toHaveBeenCalled();
    });

    // Test 4: Propagate prisma errors
    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.sessions.findUnique.mockRejectedValue(dbError);

      await expect(LogoutService(logoutData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
