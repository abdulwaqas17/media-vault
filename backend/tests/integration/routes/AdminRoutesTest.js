import { jest } from "@jest/globals";
import request from "supertest";

// ============================================================
// STEP 1: Mock All Dependencies FIRST
// ============================================================

// Mock AdminService
jest.unstable_mockModule("../../../src/modules/admin/AdminService.js", () => ({
  ToggleUserStatusService: jest.fn(),
  DeleteUserService: jest.fn()
}));

// Mock RoleMiddleware - bypass role check
jest.unstable_mockModule("../../../src/middlewares/RoleMiddleware.js", () => ({
  RoleMiddleware: jest.fn(() => {
    return (req, res, next) => {
      req.user = { ...req.user, role: "Admin" };
      next();
    };
  })
}));



// Mock constants
import { ROLES } from "../../../src/constants/constants.js";

// ============================================================
// STEP 2: Import App DYNAMICALLY after mocks
// ============================================================
const { default: app } = await import("../../../src/app.js");

// ============================================================
// STEP 3: Import Services
// ============================================================
const {
  ToggleUserStatusService,
  DeleteUserService
} = await import("../../../src/modules/admin/AdminService.js");

const { ApiError } = await import("../../../src/utils/ApiError.js");

const BASE_URL = "/api/admin";

// Test data
const mockUserId = "user_123";
const mockUpdatedUser = {
  userId: mockUserId,
  status: "Inactive"
};

const mockErrors = {
  userNotFound: new ApiError(404, "User not found"),
  adminSelfDelete: new ApiError(400, "User cannot delete Admin Account")
};

describe("Admin Routes - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TOGGLE USER STATUS ROUTE TESTS
  // PATCH /api/admin/users/:userId/deactivate
  // ============================================================
  describe("PATCH /api/admin/users/:userId/deactivate", () => {
    const toggleEndpoint = `${BASE_URL}/users/${mockUserId}/deactivate`;

    // Test 1: Success
    it("should toggle user status successfully", async () => {
      ToggleUserStatusService.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch(toggleEndpoint)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "User status updated successfully",
        data: {
          userId: mockUserId,
          status: "Inactive"
        }
      });

      expect(ToggleUserStatusService).toHaveBeenCalledWith(mockUserId);
    });

    // Test 4: Service error - User not found
    it("should return 404 when user does not exist", async () => {
      ToggleUserStatusService.mockRejectedValue(mockErrors.userNotFound);

      const response = await request(app)
        .patch(toggleEndpoint)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "User not found"
      });
    });
  });

  // ============================================================
  // DELETE USER ROUTE TESTS
  // DELETE /api/admin/users/:userId
  // ============================================================
  describe("DELETE /api/admin/users/:userId", () => {
    const deleteEndpoint = `${BASE_URL}/users/${mockUserId}`;

    // Test 1: Success
    it("should delete user successfully", async () => {
      DeleteUserService.mockResolvedValue();

      const response = await request(app)
        .delete(deleteEndpoint)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "User deleted successfully"
      });

      expect(DeleteUserService).toHaveBeenCalledWith(mockUserId, expect.any(Object));
    });

    // Test 4: Service error - User not found
    it("should return 404 when user does not exist", async () => {
      DeleteUserService.mockRejectedValue(mockErrors.userNotFound);

      const response = await request(app)
        .delete(deleteEndpoint)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "User not found"
      });
    });

    // Test 5: Admin trying to delete themselves
    it("should return 400 when admin tries to delete themselves", async () => {
      DeleteUserService.mockRejectedValue(mockErrors.adminSelfDelete);

      const response = await request(app)
        .delete(deleteEndpoint)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: "User cannot delete Admin Account"
      });
    });
  });
});