import { jest } from "@jest/globals";

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));



// Mock SessionUtils
jest.unstable_mockModule("../../../src/utils/SessionUtils.js", () => ({
  ExpireUserSessions: jest.fn()
}));

// Mock AwsUtils
jest.unstable_mockModule("../../../src/utils/AwsUtils.js", () => ({
  DeleteFromS3: jest.fn(),
  BulkDeleteFromS3: jest.fn(),
  InvalidateCloudFront: jest.fn(),
  BulkInvalidateCloudFront: jest.fn()
}));

// Mock logger
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Dynamic imports
const prisma = (await import("../../../src/config/prisma.js")).default;
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { UserStatus } = await import("../../../src/constants/constants.js");
const { ExpireUserSessions } = await import("../../../src/utils/SessionUtils.js");
const { BulkDeleteFromS3, BulkInvalidateCloudFront } = await import("../../../src/utils/AwsUtils.js");
const logger = (await import("../../../src/config/logger.js")).default;

const {
  ToggleUserStatusService,
  DeleteUserService
} = await import("../../../src/modules/admin/AdminService.js");

describe("AdminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TOGGLE USER STATUS SERVICE TESTS
  // ============================================================
  describe("ToggleUserStatusService", () => {
    const userId = "user_123";
    const mockUser = {
      id: userId,
      email: "john@example.com",
      status: UserStatus.Active
    };

    it("should toggle user status from Active to Inactive and expire all sessions", async () => {
      const activeUser = {
        ...mockUser,
        status: UserStatus.Active
      };

      prisma.users.findUnique.mockResolvedValue(activeUser);
      prisma.users.update.mockResolvedValue({
        ...activeUser,
        status: UserStatus.Inactive
      });
      ExpireUserSessions.mockResolvedValue(true);

      const result = await ToggleUserStatusService(userId);

      expect(result).toEqual({
        userId,
        status: UserStatus.Inactive
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: UserStatus.Inactive }
      });
      expect(ExpireUserSessions).toHaveBeenCalledWith(userId);
      expect(logger.info).toHaveBeenCalledWith(
        "User deactivated successfully",
        { userId }
      );
    });

    it("should toggle user status from Inactive to Active without expiring sessions", async () => {
      const inactiveUser = {
        ...mockUser,
        status: UserStatus.Inactive
      };

      prisma.users.findUnique.mockResolvedValue(inactiveUser);
      prisma.users.update.mockResolvedValue({
        ...inactiveUser,
        status: UserStatus.Active
      });

      const result = await ToggleUserStatusService(userId);

      expect(result).toEqual({
        userId,
        status: UserStatus.Active
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: UserStatus.Active }
      });
      expect(ExpireUserSessions).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "User deactivated successfully",
        { userId }
      );
    });

    it("should throw when user does not exist", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(ToggleUserStatusService(userId)).rejects.toThrow(ApiError);
      await expect(ToggleUserStatusService(userId)).rejects.toThrow(
        "User not found"
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
      expect(ExpireUserSessions).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // DELETE USER SERVICE TESTS
  // ============================================================
  describe("DeleteUserService", () => {
    const userId = "user_123";
    
    //  Mock req object with different user ID (admin deleting another user)
    const mockReq = {
      user: {
        userId: "admin_456" // Different from userId being deleted
      }
    };

    const mockUser = {
      id: userId,
      email: "john@example.com",
      media_assets: []
    };

    const mockUserWithMedia = {
      id: userId,
      email: "john@example.com",
      media_assets: [
        {
          id: "media_1",
          s3_key: "profile/photo1.jpg"
        },
        {
          id: "media_2",
          s3_key: "profile/photo2.jpg"
        }
      ]
    };

    // Test 1: Delete user successfully when no media assets exist
    it("should delete user successfully when no media assets exist", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);
      prisma.users.delete.mockResolvedValue(mockUser);

      const result = await DeleteUserService(userId, mockReq);

      expect(result).toBeUndefined();
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { media_assets: true }
      });
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(logger.info).toHaveBeenCalledWith(
        "User deleted successfully",
        { userId }
      );
      expect(BulkDeleteFromS3).not.toHaveBeenCalled();
      expect(BulkInvalidateCloudFront).not.toHaveBeenCalled();
    });

    // Test 2: Delete user and remove all media assets from S3 and CloudFront
    it("should delete user and remove all media assets from S3 and CloudFront", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUserWithMedia);
      prisma.users.delete.mockResolvedValue(mockUserWithMedia);

      BulkDeleteFromS3.mockResolvedValue();
      BulkInvalidateCloudFront.mockResolvedValue();

      const result = await DeleteUserService(userId, mockReq);

      expect(result).toBeUndefined();
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { media_assets: true }
      });
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(BulkDeleteFromS3).toHaveBeenCalledWith([
        "profile/photo1.jpg",
        "profile/photo2.jpg"
      ]);
      expect(BulkInvalidateCloudFront).toHaveBeenCalledWith([
        "profile/photo1.jpg",
        "profile/photo2.jpg"
      ]);
      expect(logger.info).toHaveBeenCalledWith(
        "User deleted successfully",
        { userId }
      );
    });

    // Test 3: Continue deleting user even if S3 cleanup fails
    it("should continue deleting user even if S3 cleanup fails", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUserWithMedia);
      prisma.users.delete.mockResolvedValue(mockUserWithMedia);

      const s3Error = new Error("S3 service unavailable");
      BulkDeleteFromS3.mockRejectedValue(s3Error);
      BulkInvalidateCloudFront.mockResolvedValue();

      const result = await DeleteUserService(userId, mockReq);

      expect(result).toBeUndefined();
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { media_assets: true }
      });
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(BulkDeleteFromS3).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to delete user media assets in bulk:",
        s3Error
      );
      expect(logger.info).toHaveBeenCalledWith(
        "User deleted successfully",
        { userId }
      );
    });

    // Test 4: Throw when user does not exist
    it("should throw when user does not exist", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(DeleteUserService(userId, mockReq)).rejects.toThrow(ApiError);
      await expect(DeleteUserService(userId, mockReq)).rejects.toThrow(
        "User not found"
      );
      expect(prisma.users.delete).not.toHaveBeenCalled();
      expect(BulkDeleteFromS3).not.toHaveBeenCalled();
    });

    //  ADD THIS TEST: Admin trying to delete themselves
    it("should throw when admin tries to delete themselves", async () => {
      const mockReqSelf = {
        user: {
          userId: userId // Same as userId being deleted
        }
      };

      await expect(DeleteUserService(userId, mockReqSelf)).rejects.toThrow(ApiError);
      await expect(DeleteUserService(userId, mockReqSelf)).rejects.toThrow(
        "User cannot delete Admin Account"
      );
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
      expect(prisma.users.delete).not.toHaveBeenCalled();
    });
  });
});