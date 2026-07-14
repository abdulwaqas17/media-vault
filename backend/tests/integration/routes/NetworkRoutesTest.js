// tests/integration/routes/NetworkRoutesTest.js

import { jest } from "@jest/globals";
import request from "supertest";

// ============================================================
// STEP 1: Mock All Dependencies FIRST - Including heavy ones
// ============================================================

// ✅ Mock Prisma FIRST - before app import
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    $disconnect: jest.fn(),
    users: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    },
    sessions: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn()
    },
    profiles: {
      upsert: jest.fn()
    },
    media_assets: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn()
    },
    roles: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

// ✅ Mock Logger - No file writes
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// ✅ Mock Cron Job - No background jobs
jest.unstable_mockModule("../../../src/jobs/SessionsCleanupJob.js", () => ({
  ScheduleExpiredSessionCleanup: jest.fn()
}));

// ✅ Mock AWS - No real AWS calls
jest.unstable_mockModule("../../../src/config/Aws.js", () => ({
  s3: {
    send: jest.fn()
  },
  cloudFront: {
    send: jest.fn()
  }
}));

// ✅ Mock Rate Limit - No real rate limiting
jest.unstable_mockModule("../../../src/config/RateLimit.js", () => ({
  RateLimiter: jest.fn((req, res, next) => next()),
  AdminRateLimiter: jest.fn((req, res, next) => next()),
  AuthRateLimiter: jest.fn((req, res, next) => next()),
  SearchRateLimiter: jest.fn((req, res, next) => next())
}));

// ✅ Mock AuthMiddleware
jest.unstable_mockModule("../../../src/middlewares/AuthMiddleware.js", () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: "user_123", sessionId: "session_123" };
    next();
  })
}));

// ✅ Mock ValidateMiddleware - Bypass validation by default
jest.unstable_mockModule("../../../src/middlewares/ValidateMiddleware.js", () => ({
  ValidateAndSanitize: jest.fn(() => {
    return (req, res, next) => {
      next();
    };
  })
}));

// ✅ Mock NetworkService
jest.unstable_mockModule("../../../src/modules/network/NetworkService.js", () => ({
  GetNetworkUsersService: jest.fn()
}));

// Mock ApiError
jest.unstable_mockModule("../../../src/utils/ApiError.js", () => ({
  ApiError: class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
      this.name = "ApiError";
    }
  }
}));

// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn()
}));

// Mock constants
jest.unstable_mockModule("../../../src/constants/constants.js", () => ({
  ROLES: {
    Admin: "Admin",
    Member: "Member"
  },
  Provider: {
    Local: "Local",
    Google: "Google"
  },
  UserStatus: {
    Active: "Active",
    Inactive: "Inactive",
    All: "All"
  },
  ImageType: {
    Profile: "profile",
    Banner: "banner",
    Avatar: "avatar"
  }
}));

// ============================================================
// STEP 2: Import App DYNAMICALLY after mocks
// ============================================================
const { default: app } = await import("../../../src/app.js");

// ============================================================
// STEP 3: Import Services
// ============================================================
const { GetNetworkUsersService } = await import("../../../src/modules/network/NetworkService.js");
const { ApiError } = await import("../../../src/utils/ApiError.js");

const BASE_URL = "/api/network";

// Mock response data
const mockNetworkUsers = {
  page: 1,
  limit: 10,
  total: 25,
  users: [
    {
      id: "user_1",
      email: "john@example.com",
      status: "Active",
      profile: {
        full_name: "John Doe",
        designation: "Developer"
      },
      media_assets: [],
      role: { name: "Member" }
    },
    {
      id: "user_2",
      email: "jane@example.com",
      status: "Active",
      profile: {
        full_name: "Jane Smith",
        designation: "Designer"
      },
      media_assets: [],
      role: { name: "Member" }
    }
  ]
};

describe("Network Routes - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // GET /api/network
  // ============================================================
  describe("GET /api/network", () => {
    const networkEndpoint = BASE_URL;

    // Test 1: Success
    it("should return network users successfully", async () => {
      GetNetworkUsersService.mockResolvedValue(mockNetworkUsers);

      const response = await request(app)
        .get(networkEndpoint)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Network users fetched successfully",
        data: {
          page: 1,
          limit: 10,
          total: 25,
          users: expect.any(Array)
        }
      });

      expect(response.body.data.users).toHaveLength(2);
      expect(GetNetworkUsersService).toHaveBeenCalled();
    });

    // Test 2: Success with query parameters
    it("should return network users with filters applied", async () => {
      GetNetworkUsersService.mockResolvedValue({
        ...mockNetworkUsers,
        users: [mockNetworkUsers.users[0]]
      });

      const response = await request(app)
        .get(networkEndpoint)
        .query({
          page: 2,
          limit: 5,
          search: "John",
          status: "Active"
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Network users fetched successfully"
      });

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        search: "John",
        status: "Active"
      });
    });

    // Test 3: Unauthorized - No token
    it("should return 401 when not authenticated", async () => {
      const { AuthMiddleware } = await import("../../../src/middlewares/AuthMiddleware.js");
      AuthMiddleware.mockImplementationOnce((req, res, next) => {
        next(new ApiError(401, "Unauthorized: No token provided"));
      });

      const response = await request(app)
        .get(networkEndpoint)
        .expect(401);

      // ✅ Only check success: false, not exact message
      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });

    // Test 4: Validation fail - Invalid page number
    it("should return 400 when page is invalid", async () => {
      const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");
      ValidateAndSanitize.mockImplementationOnce(() => {
        return (req, res, next) => {
          next(new ApiError(400, "Page must be a number"));
        };
      });

      const response = await request(app)
        .get(networkEndpoint)
        .query({ page: "invalid" })
        .expect(400);

      // ✅ Only check success: false, not exact message
      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });

    // Test 5: Validation fail - Invalid limit
    it("should return 400 when limit is invalid", async () => {
      const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");
      ValidateAndSanitize.mockImplementationOnce(() => {
        return (req, res, next) => {
          next(new ApiError(400, "Limit must be a number"));
        };
      });

      const response = await request(app)
        .get(networkEndpoint)
        .query({ limit: "invalid" })
        .expect(400);

      // ✅ Only check success: false, not exact message
      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });

    // Test 6: Validation fail - Invalid status
    it("should return 400 when status is invalid", async () => {
      const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");
      ValidateAndSanitize.mockImplementationOnce(() => {
        return (req, res, next) => {
          next(new ApiError(400, "Status must be one of Active, Inactive, or All"));
        };
      });

      const response = await request(app)
        .get(networkEndpoint)
        .query({ status: "InvalidStatus" })
        .expect(400);

      // ✅ Only check success: false, not exact message
      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });

    // Test 7: Service error
    it("should pass service errors to error handler", async () => {
      GetNetworkUsersService.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app)
        .get(networkEndpoint)
        .expect(500);

      // ✅ Only check success: false and message is string
      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.message).toBeDefined();
      expect(typeof response.body.message).toBe("string");
    });
  });
});