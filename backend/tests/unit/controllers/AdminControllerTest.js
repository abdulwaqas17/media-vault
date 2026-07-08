import { jest } from "@jest/globals";

// Mock AdminService
jest.unstable_mockModule("../../../src/modules/admin/AdminService.js", () => ({
  ToggleUserStatusService: jest.fn(),
  DeleteUserService: jest.fn(),
}));

// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn(),
}));

// Dynamic imports
const { ToggleUserStatusService, DeleteUserService } =
  await import("../../../src/modules/admin/AdminService.js");
const { SendResponse } = await import("../../../src/utils/ApiResponse.js");
const { ToggleUserStatusController, DeleteUserController } =
  await import("../../../src/modules/admin/AdminController.js");

describe("AdminController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {
        userId: "user_123",
      },
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // TOGGLE USER STATUS CONTROLLER TESTS
  // ============================================================
  describe("ToggleUserStatusController", () => {
    const userId = "user_123";
    const mockUpdatedUser = {
      userId: userId,
      status: "Inactive",
    };

    // Test 1: Happy Path
    it("should call ToggleUserStatusService with userId and return success response", async () => {
      ToggleUserStatusService.mockResolvedValue(mockUpdatedUser);
      SendResponse.mockReturnValue();

      await ToggleUserStatusController(mockReq, mockRes, mockNext);

      expect(ToggleUserStatusService).toHaveBeenCalledWith(userId);
      expect(ToggleUserStatusService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "User status updated successfully",
        mockUpdatedUser,
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("User not found");
      ToggleUserStatusService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await ToggleUserStatusController(mockReq, mockRes, mockNext);

      expect(ToggleUserStatusService).toHaveBeenCalledWith(userId);
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // DELETE USER CONTROLLER TESTS
  // ============================================================
  describe("DeleteUserController", () => {
    const userId = "user_123";

    // Test 1: Happy Path
    it("should call DeleteUserService with userId and request object and return success response", async () => {
      DeleteUserService.mockResolvedValue();
      SendResponse.mockReturnValue();

      await DeleteUserController(mockReq, mockRes, mockNext);

      expect(DeleteUserService).toHaveBeenCalledWith(userId, mockReq);
      expect(DeleteUserService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "User deleted successfully",
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("User not found");
      DeleteUserService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await DeleteUserController(mockReq, mockRes, mockNext);

      expect(DeleteUserService).toHaveBeenCalledWith(userId, mockReq);
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});