import { jest } from "@jest/globals";

/**
 * Mock request data
 */
export const mockRequest = {
  signup: {
    email: "test@example.com",
    password: "Password123",
    full_name: "Test User"
  },
  login: {
    email: "test@example.com",
    password: "Password123"
  },
  google: {
    idToken: "mock.google.id.token"
  }
};

/**
 * Mock response data
 */
export const mockResponse = {
  user: {
    id: "user_123",
    email: "test@example.com",
    provider: "Local",
    status: "Active",
    isProfileCompleted: true,
    role: { name: "Member" },
    profile: {
      full_name: "Test User"
    }
  },
  tokens: {
    accessToken: "mock.access.token",
    refreshToken: "mock.refresh.token"
  },
  session: {
    id: "session_123",
    user_id: "user_123",
    is_active: true
  }
};

/**
 * Get auth headers for protected routes
 */
export const getAuthHeaders = () => ({
  Authorization: "Bearer mock.access.token",
  Cookie: ["refreshToken=mock.refresh.token"]
});

/**
 * Mock service responses - to be used in tests
 */
export const mockServiceResponses = {
  signupSuccess: {
    user: mockResponse.user,
    accessToken: mockResponse.tokens.accessToken,
    refreshToken: mockResponse.tokens.refreshToken
  },
  loginSuccess: {
    user: mockResponse.user,
    accessToken: mockResponse.tokens.accessToken,
    refreshToken: mockResponse.tokens.refreshToken
  },
  googleSuccess: {
    user: mockResponse.user,
    accessToken: mockResponse.tokens.accessToken,
    refreshToken: mockResponse.tokens.refreshToken
  },
  refreshSuccess: {
    accessToken: "new.mock.access.token"
  },
  logoutSuccess: true
};

/**
 * Mock error responses
 */
export const mockErrors = {
  emailExists: new Error("Email already exists"),
  invalidCredentials: new Error("Invalid credentials"),
  userNotFound: new Error("User not found"),
  invalidToken: new Error("Invalid refresh token"),
  sessionNotFound: new Error("Session not found")
};