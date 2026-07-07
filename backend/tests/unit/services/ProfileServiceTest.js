import { jest } from "@jest/globals";

// Mock AWS SDK
jest.unstable_mockModule("@aws-sdk/client-s3", () => ({
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn()
}));

jest.unstable_mockModule("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn()
}));

// Mock AWS config
jest.unstable_mockModule("../../../src/config/Aws.js", () => ({
  s3: {
    send: jest.fn()
  },
  cloudFront: {
    send: jest.fn()
  }
}));

// Mock AwsUtils
jest.unstable_mockModule("../../../src/utils/AwsUtils.js", () => ({
  DeleteFromS3: jest.fn(),
  BulkDeleteFromS3: jest.fn(),
  InvalidateCloudFront: jest.fn(),
  BulkInvalidateCloudFront: jest.fn()
}));

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    $transaction: jest.fn(),
    users: {
      findUnique: jest.fn()
    },
    media_assets: {
      findMany: jest.fn()
    }
  }
}));

// Mock bcrypt
jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: jest.fn()
  }
}));

// Mock env
jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    S3_BUCKET_NAME: "test-bucket",
    CDN_URL: "https://cdn.example.com"
  }
}));

// Mock constants
jest.unstable_mockModule("../../../src/constants/constants.js", () => ({
  ImageType: {
      Profile_Picture: "Profile_Picture",
  Company_Logo: "Company_Logo"
  },
  Provider: {
    Local: "Local",
    Google: "Google"
  }
}));

// Import real ApiError
import { ApiError } from "../../../src/utils/ApiError.js";

// Dynamic imports
const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
const { s3 } = await import("../../../src/config/Aws.js");
const { BulkDeleteFromS3, BulkInvalidateCloudFront } = await import("../../../src/utils/AwsUtils.js");
const prisma = (await import("../../../src/config/prisma.js")).default;
const bcrypt = (await import("bcryptjs")).default;
const { ImageType, Provider } = await import("../../../src/constants/constants.js");

const {
  PresignedUrlService,
  UpdateProfileService,
  GetMyProfileService
} = await import("../../../src/modules/profile/ProfileService.js");

describe("ProfileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // PRESIGNED URL SERVICE TESTS
  // ============================================================
  describe("PresignedUrlService", () => {
    const params = {
      fileType: "image/jpeg",
      fileName: "photo.jpg",
      uploadFor: ImageType.Profile_Picture
    };

    it("should generate presigned url successfully", async () => {
      const mockUploadUrl = "https://s3.amazonaws.com/test-bucket/...";
      getSignedUrl.mockResolvedValue(mockUploadUrl);

      const result = await PresignedUrlService(params);

      expect(result).toEqual({
        key: expect.stringMatching(/Profile_Picture\/\d+-photo\.jpg/),
        uploadUrl: mockUploadUrl,
        cdnUrl: expect.stringContaining("https://cdn.example.com/")
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        s3,
        expect.any(Object),
        { expiresIn: 60 }
      );
    });

    it("should throw when uploadFor is invalid", async () => {
      const invalidParams = {
        ...params,
        uploadFor: "invalid_type"
      };

      await expect(PresignedUrlService(invalidParams)).rejects.toThrow(ApiError);
      await expect(PresignedUrlService(invalidParams)).rejects.toThrow(
        "Invalid uploadFor value"
      );
      expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it("should propagate AWS errors", async () => {
      const awsError = new Error("AWS service unavailable");
      getSignedUrl.mockRejectedValue(awsError);

      await expect(PresignedUrlService(params)).rejects.toThrow(
        "AWS service unavailable"
      );
    });
  });

  // ============================================================
  // UPDATE PROFILE SERVICE TESTS
  // ============================================================
  describe("UpdateProfileService", () => {
    const userId = "user_123";
    const profileData = {
      userId,
      full_name: "John Doe",
      designation: "Developer",
      contact_number: "1234567890",
      connect_me_for: "Networking",
      company_name: "Tech Corp",
      password: null,
      media_assets: [
        {
          asset_type: "profile",
          s3_key: "profile/new-key.jpg",
          cdn_url: "https://cdn.example.com/profile/new-key.jpg",
          mime_type: "image/jpeg"
        }
      ]
    };

    const mockUser = {
      id: userId,
      email: "john@example.com",
      provider: "Local",
      password: "hashedPassword",
      isProfileCompleted: false,
      profile: null
    };

    const mockExistingAssets = [
      {
        id: "asset_1",
        asset_type: "profile",
        s3_key: "profile/old-key.jpg"
      }
    ];

    const mockUpdatedUser = {
      id: userId,
      email: "john@example.com",
      provider: "Local",
      status: "Active",
      isProfileCompleted: true,
      profile: {
        full_name: "John Doe",
        designation: "Developer"
      },
      media_assets: [
        {
          asset_type: "profile",
          s3_key: "profile/new-key.jpg"
        }
      ],
      role: { name: "Member" }
    };

    // Test 1: Happy Path
    it("should update profile successfully", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockUser)        // First call: existingUser check
            .mockResolvedValueOnce(mockUpdatedUser), // Second call: final fetch
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      BulkDeleteFromS3.mockResolvedValue();
      BulkInvalidateCloudFront.mockResolvedValue();

      const result = await UpdateProfileService(profileData);

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.media_assets.findMany).toHaveBeenCalledWith({
        where: { user_id: userId }
      });
    });

    // Test 2: Throw when user does not exist
    it("should throw when user does not exist", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const mockTx = {
        users: {
          findUnique: jest.fn().mockResolvedValue(null)
        },
        profiles: {
          upsert: jest.fn()
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn(),
          create: jest.fn()
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      await expect(UpdateProfileService(profileData)).rejects.toThrow(ApiError);
      await expect(UpdateProfileService(profileData)).rejects.toThrow(
        "User not found"
      );
    });

    // Test 3: Require password for Google user without password
    it("should require password for Google user without password", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const googleUser = {
        ...mockUser,
        provider: "Google",
        password: null
      };

      const mockTx = {
        users: {
          findUnique: jest.fn().mockResolvedValue(googleUser),
          update: jest.fn()
        },
        profiles: {
          upsert: jest.fn()
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn(),
          create: jest.fn()
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      const dataWithoutPassword = {
        ...profileData,
        password: null
      };

      await expect(UpdateProfileService(dataWithoutPassword)).rejects.toThrow(ApiError);
      await expect(UpdateProfileService(dataWithoutPassword)).rejects.toThrow(
        "Password is required for Google signing users"
      );
    });

    // Test 4: Hash password for Google user
    it("should hash password for Google user", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const googleUser = {
        ...mockUser,
        provider: "Google",
        password: null
      };

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(googleUser)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      bcrypt.hash.mockResolvedValue("hashedPassword");

      const dataWithPassword = {
        ...profileData,
        password: "NewPassword123"
      };

      await UpdateProfileService(dataWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123", 10);
      expect(mockTx.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: "hashedPassword" }
      });
    });

    // Test 5: Mark profile as completed
    it("should mark profile as completed", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const userWithoutProfile = {
        ...mockUser,
        isProfileCompleted: false
      };

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(userWithoutProfile)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      await UpdateProfileService(profileData);

      expect(mockTx.users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isProfileCompleted: true }
      });
    });

    // Test 6: Update media assets
    it("should update media assets", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      await UpdateProfileService(profileData);

      expect(mockTx.media_assets.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          asset_type: "profile"
        }
      });
      expect(mockTx.media_assets.create).toHaveBeenCalled();
    });

    // Test 7: Delete old S3 assets when keys change
    it("should delete old S3 assets when keys change", async () => {
      prisma.media_assets.findMany.mockResolvedValue(mockExistingAssets);

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      BulkDeleteFromS3.mockResolvedValue();
      BulkInvalidateCloudFront.mockResolvedValue();

      await UpdateProfileService(profileData);

      expect(prisma.media_assets.findMany).toHaveBeenCalledWith({
        where: { user_id: userId }
      });
      expect(BulkDeleteFromS3).toHaveBeenCalledWith(["profile/old-key.jpg"]);
      expect(BulkInvalidateCloudFront).toHaveBeenCalledWith(["profile/old-key.jpg"]);
    });

    // Test 8: Skip S3 cleanup when keys are unchanged
    it("should skip S3 cleanup when keys are unchanged", async () => {
      const sameKeyAssets = [
        {
          id: "asset_1",
          asset_type: "profile",
          s3_key: "profile/new-key.jpg"
        }
      ];

      prisma.media_assets.findMany.mockResolvedValue(sameKeyAssets);

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      await UpdateProfileService(profileData);

      expect(BulkDeleteFromS3).not.toHaveBeenCalled();
      expect(BulkInvalidateCloudFront).not.toHaveBeenCalled();
    });

    // Test 9: Ignore S3 cleanup failures
    it("should ignore S3 cleanup failures", async () => {
      prisma.media_assets.findMany.mockResolvedValue(mockExistingAssets);

      const mockTx = {
        users: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockUpdatedUser),
          update: jest.fn().mockResolvedValue({})
        },
        profiles: {
          upsert: jest.fn().mockResolvedValue({})
        },
        media_assets: {
          findMany: jest.fn(),
          deleteMany: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockResolvedValue({})
        }
      };
      prisma.$transaction.mockImplementation((callback) => callback(mockTx));

      BulkDeleteFromS3.mockRejectedValue(new Error("S3 error"));

      const result = await UpdateProfileService(profileData);
      expect(result).toEqual(mockUpdatedUser);
    });

    // Test 10: Propagate prisma transaction errors
    it("should propagate prisma transaction errors", async () => {
      prisma.media_assets.findMany.mockResolvedValue([]);

      const dbError = new Error("Transaction failed");
      prisma.$transaction.mockRejectedValue(dbError);

      await expect(UpdateProfileService(profileData)).rejects.toThrow(
        "Transaction failed"
      );
    });
  });

  // ============================================================
  // GET MY PROFILE SERVICE TESTS
  // ============================================================
  describe("GetMyProfileService", () => {
    const userId = "user_123";
    const mockUser = {
      id: userId,
      email: "john@example.com",
      provider: "Local",
      status: "Active",
      isProfileCompleted: true,
      profile: {
        full_name: "John Doe",
        designation: "Developer"
      },
      media_assets: [],
      role: { name: "Member" }
    };

    it("should return user profile", async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser);

      const result = await GetMyProfileService(userId);

      expect(result).toEqual(mockUser);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          provider: true,
          status: true,
          isProfileCompleted: true,
          profile: true,
          media_assets: true,
          role: true
        }
      });
    });

    it("should throw when user is not found", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(GetMyProfileService(userId)).rejects.toThrow("User not found");
    });

    it("should propagate prisma errors", async () => {
      const dbError = new Error("Database connection failed");
      prisma.users.findUnique.mockRejectedValue(dbError);

      await expect(GetMyProfileService(userId)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});