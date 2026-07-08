import { jest } from "@jest/globals";

// Mock ProfileService
jest.unstable_mockModule("../../../src/modules/profile/ProfileService.js", () => ({
  PresignedUrlService: jest.fn(),
  UpdateProfileService: jest.fn(),
  GetMyProfileService: jest.fn()
}));


// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn()
}));

// Mock process.env
const originalEnv = { ...process.env };

// Dynamic imports
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { SendResponse } = await import("../../../src/utils/ApiResponse.js");
const {
  PresignedUrlService,
  UpdateProfileService,
  GetMyProfileService
} = await import("../../../src/modules/profile/ProfileService.js");

const {
  PresignedUrlController,
  UpdateProfileController,
  GetMyProfileController
} = await import("../../../src/modules/profile/ProfileController.js");

describe("ProfileController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: null,
      user: {
        userId: "user_123"
      }
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env after each test
    process.env = { ...originalEnv };
  });

  // ============================================================
  // PRESIGNED URL CONTROLLER TESTS
  // ============================================================
  describe("PresignedUrlController", () => {
    const mockFile = {
      filename: "photo-1234567890.jpg"
    };

    const mockPresignedResult = {
      key: "profile/1234567890-photo.jpg",
      uploadUrl: "https://s3.amazonaws.com/...",
      cdnUrl: "https://cdn.example.com/profile/1234567890-photo.jpg"
    };

    // Test 1: Local upload when USE_CDN is false
    it("should return local upload response when USE_CDN is false", async () => {
      process.env.USE_CDN = "false";
      process.env.BACKEND_URL = "http://localhost:5000";
      
      mockReq.file = mockFile;

      await PresignedUrlController(mockReq, mockRes, mockNext);

      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Image uploaded successfully",
        {
          uploadType: "local",
          key: mockFile.filename,
          fileUrl: `${process.env.BACKEND_URL}/uploads/${mockFile.filename}`
        }
      );
      expect(PresignedUrlService).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Throw when no file is provided for local upload
    it("should throw when no file is provided for local upload", async () => {
      process.env.USE_CDN = "false";
      mockReq.file = null;

      await PresignedUrlController(mockReq, mockRes, mockNext);

      expect(SendResponse).not.toHaveBeenCalled();
      expect(PresignedUrlService).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No file provided",
          statusCode: 400
        })
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    // Test 3: CDN upload when USE_CDN is true
    it("should call PresignedUrlService and return CDN upload response when USE_CDN is true", async () => {
      process.env.USE_CDN = "true";
      
      mockReq.body = {
        asset_type: "profile",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
      };

      PresignedUrlService.mockResolvedValue(mockPresignedResult);
      SendResponse.mockReturnValue();

      await PresignedUrlController(mockReq, mockRes, mockNext);

      expect(PresignedUrlService).toHaveBeenCalledWith({
        fileType: mockReq.body.mime_type,
        fileName: mockReq.body.file_name,
        uploadFor: mockReq.body.asset_type
      });
      expect(PresignedUrlService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Presigned URL generated successfully",
        {
          uploadType: "cdn",
          key: mockPresignedResult.key,
          uploadUrl: mockPresignedResult.uploadUrl,
          cdnUrl: mockPresignedResult.cdnUrl
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 4: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      process.env.USE_CDN = "true";
      
      mockReq.body = {
        asset_type: "profile",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
      };

      const error = new Error("Invalid uploadFor value");
      PresignedUrlService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await PresignedUrlController(mockReq, mockRes, mockNext);

      expect(PresignedUrlService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // UPDATE PROFILE CONTROLLER TESTS
  // ============================================================
  describe("UpdateProfileController", () => {
    const profileData = {
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

    const mockUpdatedUser = {
      id: "user_123",
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

    beforeEach(() => {
      mockReq.body = profileData;
    });

    // Test 1: Happy Path
    it("should call UpdateProfileService with request data and return success response", async () => {
      UpdateProfileService.mockResolvedValue(mockUpdatedUser);
      SendResponse.mockReturnValue();

      await UpdateProfileController(mockReq, mockRes, mockNext);

      expect(UpdateProfileService).toHaveBeenCalledWith({
        userId: mockReq.user.userId,
        full_name: profileData.full_name,
        designation: profileData.designation,
        contact_number: profileData.contact_number,
        connect_me_for: profileData.connect_me_for,
        company_name: profileData.company_name,
        password: profileData.password,
        media_assets: profileData.media_assets
      });
      expect(UpdateProfileService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Profile updated successfully",
        mockUpdatedUser
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("User not found");
      UpdateProfileService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await UpdateProfileController(mockReq, mockRes, mockNext);

      expect(UpdateProfileService).toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // GET MY PROFILE CONTROLLER TESTS
  // ============================================================
  describe("GetMyProfileController", () => {
    const mockUserData = {
      id: "user_123",
      email: "john@example.com",
      provider: "Local",
      status: "Active",
      isProfileCompleted: true,
      profile: {
        full_name: "John Doe",
        designation: "Developer",
        contact_number: "1234567890",
        connect_me_for: "Networking",
        company_name: "Tech Corp"
      },
      media_assets: [],
      role: { name: "Member" }
    };

    // Test 1: Happy Path
    it("should return profile successfully", async () => {
      GetMyProfileService.mockResolvedValue(mockUserData);
      SendResponse.mockReturnValue();

      await GetMyProfileController(mockReq, mockRes, mockNext);

      expect(GetMyProfileService).toHaveBeenCalledWith(mockReq.user.userId);
      expect(GetMyProfileService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "User profile fetched successfully",
        mockUserData
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should return error when userId is missing
    it("should return error when userId is missing", async () => {
      mockReq.user.userId = undefined;

      await GetMyProfileController(mockReq, mockRes, mockNext);

      expect(GetMyProfileService).not.toHaveBeenCalled();
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid user session",
          statusCode: 400
        })
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    // Test 3: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      const error = new Error("User not found");
      GetMyProfileService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await GetMyProfileController(mockReq, mockRes, mockNext);

      expect(GetMyProfileService).toHaveBeenCalledWith(mockReq.user.userId);
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});