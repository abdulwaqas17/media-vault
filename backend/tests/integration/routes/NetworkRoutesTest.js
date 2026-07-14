import { jest } from "@jest/globals";
import request from "supertest";

// =========================
// Mock Service
// =========================
jest.unstable_mockModule(
  "../../../src/modules/network/NetworkService.js",
  () => ({
    GetNetworkUsersService: jest.fn(),
  })
);

// =========================
// Mock Auth Middleware
// =========================
jest.unstable_mockModule(
  "../../../src/middlewares/AuthMiddleware.js",
  () => ({
    AuthMiddleware: jest.fn((req, res, next) => {
      req.user = {
        userId: "user_123",
      };
      next();
    }),
  })
);

const { default: app } = await import("../../../src/app.js");

const { GetNetworkUsersService } = await import(
  "../../../src/modules/network/NetworkService.js"
);

const { ApiError } = await import(
  "../../../src/utils/ApiError.js"
);

describe("Network Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const endpoint = "/api/network";

  const mockResponse = {
    page: 1,
    limit: 10,
    total: 2,
    users: [
      {
        id: "1",
        email: "john@test.com",
      },
      {
        id: "2",
        email: "jane@test.com",
      },
    ],
  };

  // ===========================================
  // Success
  // ===========================================
  it("should return network users successfully", async () => {
    GetNetworkUsersService.mockResolvedValue(mockResponse);

    const res = await request(app)
      .get(endpoint)
      .query({
        page: 1,
        limit: 10,
      });

    expect(res.status).toBe(200);

    expect(GetNetworkUsersService).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      status: undefined,
    });

    expect(res.body.success).toBe(true);
  });

  // ===========================================
  // Query Parameters
  // ===========================================
  it("should pass query filters to service", async () => {
    GetNetworkUsersService.mockResolvedValue(mockResponse);

    await request(app)
      .get(endpoint)
      .query({
        page: 2,
        limit: 5,
        search: "john",
        status: "Active",
      });

    expect(GetNetworkUsersService).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      search: "john",
      status: "Active",
    });
  });

  // ===========================================
  // Validation
  // ===========================================
  it("should return 400 when validation fails", async () => {
    const res = await request(app)
      .get(endpoint)
      .query({
        page: "abc",
      });

    expect(res.status).toBe(400);
  });

  // ===========================================
  // Unauthorized
  // ===========================================
  it.skip("should return 401 when not authenticated", async () => {
    // Skip because AuthMiddleware is globally mocked.
    // Test this separately in AuthMiddleware integration tests.
  });

  // ===========================================
  // Service Error
  // ===========================================
  it("should return service errors", async () => {
    GetNetworkUsersService.mockRejectedValue(
      new ApiError(500, "Database failed")
    );

    const res = await request(app).get(endpoint);

    expect(res.status).toBe(500);

    expect(res.body.success).toBe(false);
  });
});