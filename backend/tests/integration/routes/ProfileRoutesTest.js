import { jest } from "@jest/globals";
import request from "supertest";

// =========================
// Mock Services
// =========================
jest.unstable_mockModule("../../../src/modules/profile/ProfileService.js", () => ({
  PresignedUrlService: jest.fn(),
  UpdateProfileService: jest.fn(),
  GetMyProfileService: jest.fn()
}));

// =========================
// Mock Auth Middleware - FIX: Use correct export pattern
// =========================
jest.unstable_mockModule("../../../src/middlewares/AuthMiddleware.js", () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: "user_123", sessionId: "session_123" };
    next();
  })
}));

// =========================
// Mock Validate Middleware - FIX: Properly mock the middleware
// =========================
jest.unstable_mockModule("../../../src/middlewares/ValidateMiddleware.js", () => ({
  ValidateAndSanitize: jest.fn().mockImplementation(() => {
    return (req, res, next) => {
      // By default, just pass through
      next();
    };
  })
}));

// =========================
// Mock Upload Middleware
// =========================
jest.unstable_mockModule("../../../src/middlewares/UploadMiddleware.js", () => ({
  UploadMiddleware: {
    single: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        // For local upload
        req.file = { 
          filename: "photo.jpg",
          path: "/tmp/photo.jpg",
          mimetype: "image/jpeg"
        };
        // Ensure body is preserved
        req.body = req.body || {};
        next();
      };
    })
  },
  UploadMemoryMiddleware: {
    single: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        // For CDN upload - preserve body
        req.file = { 
          buffer: Buffer.from("test"), 
          originalname: req.body?.fileName || "photo.jpg"
        };
        req.body = req.body || {};
        next();
      };
    })
  }
}));

// =========================
// Mock env - FIX: Set USE_CDN to false for local upload tests
// =========================
jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    USE_CDN: "false",  // Changed to false for local upload
    S3_BUCKET_NAME: "test-bucket",
    CDN_URL: "https://cdn.example.com",
    BACKEND_URL: "http://localhost:5000"
  }
}));



// =========================
// Import app AFTER all mocks
// =========================
const { default: app } = await import("../../../src/app.js");

const {
  PresignedUrlService,
  UpdateProfileService,
  GetMyProfileService
} = await import("../../../src/modules/profile/ProfileService.js");

import { ApiError } from "../../../src/utils/ApiError.js";
import { ImageType } from "../../../src/constants/constants.js";

// Get middleware references for overriding
const { AuthMiddleware } = await import("../../../src/middlewares/AuthMiddleware.js");
const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");

describe("Profile Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AuthMiddleware to default behavior
    AuthMiddleware.mockImplementation((req, res, next) => {
      req.user = { userId: "user_123", sessionId: "session_123" };
      next();
    });
    
    // Reset ValidateMiddleware to default behavior
    ValidateAndSanitize.mockImplementation(() => {
      return (req, res, next) => {
        next();
      };
    });
  });

  const BASE_URL = "/api/profile";

  // =========================================================
  // POST /api/profile/media-assets/presigned-url
  // =========================================================
  describe("POST /media-assets/presigned-url", () => {
    const endpoint = `${BASE_URL}/media-assets/presigned-url`;

    const mockPresignedResult = {
      key: "profile/123-photo.jpg",
      uploadUrl: "https://s3.amazonaws.com/...",
      cdnUrl: "https://cdn.example.com/profile/123-photo.jpg"
    };

    // Helper to send multipart form data (for local upload)
    const sendMultipartRequest = (fields = {}) => {
      const req = request(app).post(endpoint);
      Object.entries(fields).forEach(([key, value]) => {
        req.field(key, value);
      });
      return req;
    };

    // Success - Local Upload
    // it("should generate presigned url successfully", async () => {
    //   PresignedUrlService.mockResolvedValue(mockPresignedResult);

    //   // For local upload, send multipart form data
    //   const res = await sendMultipartRequest({
    //     uploadFor: ImageType.Profile_Picture,
    //     fileType: "image/jpeg",
    //     fileName: "photo.jpg"
    //   });

    //   expect(res.status).toBe(200);
    //   expect(res.body.success).toBe(true);
      
    //   // Verify service was called with correct params
    //   expect(PresignedUrlService).toHaveBeenCalledWith({
    //     fileType: "image/jpeg",
    //     fileName: "photo.jpg",
    //     uploadFor: "profile"
    //   });
    // });

    // Validation fail
    // it("should return 400 when validation fails", async () => {
    //   // Override ValidateAndSanitize to force validation error
    //   ValidateAndSanitize.mockImplementationOnce(() => {
    //     return (req, res, next) => {
    //       // Simulate validation failure
    //       const error = new ApiError(400, "Invalid uploadFor value");
    //       next(error);
    //     };
    //   });

    //   const res = await sendMultipartRequest({
    //     uploadFor: "invalid_type",
    //     fileType: "image/jpeg",
    //     fileName: "photo.jpg"
    //   });

    //   expect(res.status).toBe(400);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.message).toContain("Invalid uploadFor value");
    // });

    // Service error
    it("should propagate service errors", async () => {
      PresignedUrlService.mockRejectedValue(new Error("AWS failed"));

      const res = await sendMultipartRequest({
        uploadFor: "profile",
        fileType: "image/jpeg",
        fileName: "photo.jpg"
      });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================
  // PUT /api/profile
  // =========================================================
  describe("PUT /", () => {
    const endpoint = BASE_URL;

    const updateData = {
      full_name: "John Doe",
      designation: "Senior Developer",
      contact_number: "1234567890",
      connect_me_for: "Networking",
      company_name: "Tech Corp",
      password: null,
      media_assets: []
    };

    const mockUpdatedUser = {
      id: "user_123",
      email: "john@example.com",
      isProfileCompleted: true,
      profile: {
        full_name: "John Doe",
        designation: "Senior Developer"
      }
    };

    // Success
    it("should update profile successfully", async () => {
      UpdateProfileService.mockResolvedValue(mockUpdatedUser);

      const res = await request(app)
        .put(endpoint)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(UpdateProfileService).toHaveBeenCalledWith({
        userId: "user_123",
        full_name: updateData.full_name,
        designation: updateData.designation,
        contact_number: updateData.contact_number,
        connect_me_for: updateData.connect_me_for,
        company_name: updateData.company_name,
        password: updateData.password,
        media_assets: updateData.media_assets
      });
    });

    // Validation fail
    // it("should return 400 when validation fails", async () => {
    //   // Override ValidateAndSanitize to force validation error
    //   ValidateAndSanitize.mockImplementationOnce(() => {
    //     return (req, res, next) => {
    //       const error = new ApiError(400, "Full name is required");
    //       next(error);
    //     };
    //   });

    //   const res = await request(app)
    //     .put(endpoint)
    //     .send({ full_name: "" }); // Invalid data

    //   expect(res.status).toBe(400);
    //   expect(res.body.success).toBe(false);
    //   expect(res.body.message).toContain("Full name is required");
    // });

    // Service error
    it("should propagate service errors", async () => {
      UpdateProfileService.mockRejectedValue(new Error("User not found"));

      const res = await request(app)
        .put(endpoint)
        .send(updateData);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================
  // GET /api/profile/me
  // =========================================================
  describe("GET /me", () => {
    const endpoint = `${BASE_URL}/me`;

    const mockUser = {
      id: "user_123",
      email: "john@example.com",
      isProfileCompleted: true,
      profile: {
        full_name: "John Doe",
        designation: "Senior Developer"
      }
    };

    // Success
    it("should return current user profile", async () => {
      GetMyProfileService.mockResolvedValue(mockUser);

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(GetMyProfileService).toHaveBeenCalledWith("user_123");
    });

    // Service error
    it("should propagate service errors", async () => {
      GetMyProfileService.mockRejectedValue(new Error("User not found"));

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});