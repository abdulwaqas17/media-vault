// tests/integration/routes/ProfileRoutesTest.js

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
// Mock Auth Middleware
// =========================
jest.unstable_mockModule("../../../src/middlewares/AuthMiddleware.js", () => ({
  AuthMiddleware: jest.fn((req, res, next) => {
    req.user = { userId: "user_123", sessionId: "session_123" };
    next();
  })
}));

// =========================
// Mock Validate Middleware
// =========================
jest.unstable_mockModule("../../../src/middlewares/ValidateMiddleware.js", () => ({
  ValidateAndSanitize: jest.fn(() => (req, res, next) => next())
}));

// =========================
// Mock Upload Middleware - FIX: Populate req.body from request
// =========================
jest.unstable_mockModule("../../../src/middlewares/UploadMiddleware.js", () => ({
  UploadMiddleware: {
    single: jest.fn(() => (req, res, next) => {
      req.file = { filename: "test.jpg" };
      // ✅ Keep existing body
      req.body = req.body || {};
      next();
    })
  },
  UploadMemoryMiddleware: {
    single: jest.fn(() => (req, res, next) => {
      req.file = { buffer: Buffer.from("test"), originalname: "test.jpg" };
      // ✅ Keep existing body
      req.body = req.body || {};
      next();
    })
  }
}));

// =========================
// Mock env
// =========================
jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    USE_CDN: "true",
    S3_BUCKET_NAME: "test-bucket",
    CDN_URL: "https://cdn.example.com",
    BACKEND_URL: "http://localhost:5000"
  }
}));

// =========================
// Mock ApiError
// =========================
jest.unstable_mockModule("../../../src/utils/ApiError.js", () => ({
  ApiError: class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
      this.name = "ApiError";
    }
  }
}));

const { default: app } = await import("../../../src/app.js");

const {
  PresignedUrlService,
  UpdateProfileService,
  GetMyProfileService
} = await import("../../../src/modules/profile/ProfileService.js");

const { ApiError } = await import("../../../src/utils/ApiError.js");

// ✅ Get AuthMiddleware reference for overriding
const { AuthMiddleware } = await import("../../../src/middlewares/AuthMiddleware.js");
const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");

describe("Profile Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Reset AuthMiddleware to default behavior
    AuthMiddleware.mockImplementation((req, res, next) => {
      req.user = { userId: "user_123", sessionId: "session_123" };
      next();
    });
    // ✅ Reset ValidateMiddleware to default behavior
    ValidateAndSanitize.mockImplementation(() => (req, res, next) => next());
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

    // ✅ Helper to send multipart form data
    const sendPresignedRequest = (data = {}) => {
      const req = request(app).post(endpoint);
      Object.entries(data).forEach(([key, value]) => {
        req.field(key, value);
      });
      return req;
    };

    // Success
    it("should generate presigned url successfully", async () => {
      PresignedUrlService.mockResolvedValue(mockPresignedResult);

      const res = await sendPresignedRequest({
        asset_type: "profile",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(PresignedUrlService).toHaveBeenCalledWith({
        fileType: "image/jpeg",
        fileName: "photo.jpg",
        uploadFor: "profile"
      });
    });

    // Unauthorized
    it("should return 401 when not authenticated", async () => {
      // ✅ Override: Force 401
      AuthMiddleware.mockImplementationOnce((req, res, next) => {
        next(new ApiError(401, "Unauthorized: No token provided"));
      });

      const res = await sendPresignedRequest({
        asset_type: "profile",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // Validation fail
    it("should return 400 when validation fails", async () => {
      // ✅ Override: Force 400
      ValidateAndSanitize.mockImplementationOnce(() => {
        return (req, res, next) => {
          next(new ApiError(400, "Invalid uploadFor value"));
        };
      });

      const res = await sendPresignedRequest({
        asset_type: "invalid_type",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Service error
    it("should propagate service errors", async () => {
      PresignedUrlService.mockRejectedValue(new Error("AWS failed"));

      const res = await sendPresignedRequest({
        asset_type: "profile",
        file_name: "photo.jpg",
        mime_type: "image/jpeg"
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

    // Unauthorized
    it("should return 401 when not authenticated", async () => {
      AuthMiddleware.mockImplementationOnce((req, res, next) => {
        next(new ApiError(401, "Unauthorized: No token provided"));
      });

      const res = await request(app)
        .put(endpoint)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    // Validation fail
    it("should return 400 when validation fails", async () => {
      ValidateAndSanitize.mockImplementationOnce(() => {
        return (req, res, next) => {
          next(new ApiError(400, "Full name is required"));
        };
      });

      const res = await request(app)
        .put(endpoint)
        .send({ full_name: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

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

    // Unauthorized
    it("should return 401 when not authenticated", async () => {
      AuthMiddleware.mockImplementationOnce((req, res, next) => {
        next(new ApiError(401, "Unauthorized: No token provided"));
      });

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
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