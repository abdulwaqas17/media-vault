// tests/unit/utils/AwsUtilsTest.js

import { jest } from "@jest/globals";

// Mock AWS SDK clients
jest.unstable_mockModule("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}));

jest.unstable_mockModule("@aws-sdk/client-cloudfront", () => ({
  CloudFrontClient: jest.fn(),
  CreateInvalidationCommand: jest.fn(),
}));

// Create mock objects with send method BEFORE mocking config
const mockS3 = {
  send: jest.fn(),
};

const mockCloudFront = {
  send: jest.fn(),
};

// Mock AWS config with the mock objects
jest.unstable_mockModule("../../../src/config/Aws.js", () => ({
  s3: mockS3,
  cloudFront: mockCloudFront,
}));

// Mock env
jest.unstable_mockModule("../../../src/config/env.js", () => ({
  default: {
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret-key",
    S3_BUCKET_NAME: "test-bucket",
    CLOUDFRONT_DISTRIBUTION_ID: "test-distribution-id",
  },
}));

// Dynamic imports
const { S3Client } = await import("@aws-sdk/client-s3");
const { CloudFrontClient } = await import("@aws-sdk/client-cloudfront");
const { DeleteObjectCommand, DeleteObjectsCommand } =
  await import("@aws-sdk/client-s3");
const { CreateInvalidationCommand } =
  await import("@aws-sdk/client-cloudfront");
// Import the mocked objects - these will be the mock objects we defined above
const { s3, cloudFront } = await import("../../../src/config/Aws.js");
const env = (await import("../../../src/config/env.js")).default;
const { ApiError } = await import("../../../src/utils/ApiError.js");

const {
  DeleteFromS3,
  BulkDeleteFromS3,
  InvalidateCloudFront,
  BulkInvalidateCloudFront,
} = await import("../../../src/utils/AwsUtils.js");

describe("S3 and CloudFront Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    s3.send.mockReset();
    cloudFront.send.mockReset();
  });

  // ============================================================
  // TEST SUITE 1: DeleteFromS3
  // ============================================================
  describe("DeleteFromS3", () => {
    it("should delete single object from S3 successfully", async () => {
      const s3Key = "images/photo.jpg";

      s3.send.mockResolvedValue({});

      await DeleteFromS3(s3Key);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
      });
      expect(s3.send).toHaveBeenCalled();
    });

    it("should throw ApiError when S3 deletion fails", async () => {
      const s3Key = "images/photo.jpg";
      const s3Error = new Error("S3 service unavailable");

      s3.send.mockRejectedValue(s3Error);

      await expect(DeleteFromS3(s3Key)).rejects.toThrow(ApiError);
      await expect(DeleteFromS3(s3Key)).rejects.toThrow(
        "Failed to delete media asset from S3",
      );
    });
  });

  // ============================================================
  // TEST SUITE 2: BulkDeleteFromS3
  // ============================================================
  describe("BulkDeleteFromS3", () => {
    it("should bulk delete multiple objects from S3 successfully", async () => {
      const s3Keys = [
        "images/photo1.jpg",
        "images/photo2.jpg",
        "videos/clip.mp4",
      ];

      s3.send.mockResolvedValue({});

      await BulkDeleteFromS3(s3Keys);

      expect(DeleteObjectsCommand).toHaveBeenCalledWith({
        Bucket: env.S3_BUCKET_NAME,
        Delete: {
          Objects: s3Keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });
      expect(s3.send).toHaveBeenCalled();
    });

    it("should return early when s3Keys is empty", async () => {
      const testCases = [null, undefined, []];

      for (const emptyKeys of testCases) {
        await BulkDeleteFromS3(emptyKeys);

        expect(DeleteObjectsCommand).not.toHaveBeenCalled();
        expect(s3.send).not.toHaveBeenCalled();
      }
    });

    it("should throw ApiError when bulk deletion fails", async () => {
      const s3Keys = ["images/photo1.jpg", "images/photo2.jpg"];
      const s3Error = new Error("S3 service unavailable");

      s3.send.mockRejectedValue(s3Error);

      await expect(BulkDeleteFromS3(s3Keys)).rejects.toThrow(ApiError);
      await expect(BulkDeleteFromS3(s3Keys)).rejects.toThrow(
        "Failed to delete media assets from S3",
      );
    });
  });

  // ============================================================
  // TEST SUITE 3: InvalidateCloudFront
  // ============================================================
  describe("InvalidateCloudFront", () => {
    it("should invalidate CloudFront cache for single object", async () => {
      const s3Key = "images/photo.jpg";

      cloudFront.send.mockResolvedValue({});

      await InvalidateCloudFront(s3Key);

      expect(CreateInvalidationCommand).toHaveBeenCalledWith({
        DistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: expect.any(String),
          Paths: {
            Quantity: 1,
            Items: [`/${s3Key}`],
          },
        },
      });
      expect(cloudFront.send).toHaveBeenCalled();
    });

    it("should skip invalidation when CLOUDFRONT_DISTRIBUTION_ID is not set", async () => {
      const s3Key = "images/photo.jpg";

      const originalDistId = env.CLOUDFRONT_DISTRIBUTION_ID;
      env.CLOUDFRONT_DISTRIBUTION_ID = null;

      await InvalidateCloudFront(s3Key);

      expect(CreateInvalidationCommand).not.toHaveBeenCalled();
      expect(cloudFront.send).not.toHaveBeenCalled();

      env.CLOUDFRONT_DISTRIBUTION_ID = originalDistId;
    });

    it("should throw ApiError when invalidation fails", async () => {
      const s3Key = "images/photo.jpg";
      const cfError = new Error("CloudFront service error");

      cloudFront.send.mockRejectedValue(cfError);

      await expect(InvalidateCloudFront(s3Key)).rejects.toThrow(ApiError);
      await expect(InvalidateCloudFront(s3Key)).rejects.toThrow(
        "Failed to invalidate CDN cache",
      );
    });
  });

  // ============================================================
  // TEST SUITE 4: BulkInvalidateCloudFront
  // ============================================================
  describe("BulkInvalidateCloudFront", () => {
    it("should invalidate multiple paths in CloudFront", async () => {
      const s3Keys = [
        "images/photo1.jpg",
        "images/photo2.jpg",
        "videos/clip.mp4",
      ];

      cloudFront.send.mockResolvedValue({});

      await BulkInvalidateCloudFront(s3Keys);

      expect(CreateInvalidationCommand).toHaveBeenCalledWith({
        DistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: expect.any(String),
          Paths: {
            Quantity: s3Keys.length,
            Items: s3Keys.map((key) => `/${key}`),
          },
        },
      });
      expect(cloudFront.send).toHaveBeenCalled();
    });

    it("should return early when s3Keys is empty", async () => {
      const testCases = [null, undefined, []];

      for (const emptyKeys of testCases) {
        await BulkInvalidateCloudFront(emptyKeys);

        expect(CreateInvalidationCommand).not.toHaveBeenCalled();
        expect(cloudFront.send).not.toHaveBeenCalled();
      }
    });

    it("should skip invalidation when CLOUDFRONT_DISTRIBUTION_ID is not set", async () => {
      const s3Keys = ["images/photo1.jpg", "images/photo2.jpg"];

      const originalDistId = env.CLOUDFRONT_DISTRIBUTION_ID;
      env.CLOUDFRONT_DISTRIBUTION_ID = null;

      await BulkInvalidateCloudFront(s3Keys);

      expect(CreateInvalidationCommand).not.toHaveBeenCalled();
      expect(cloudFront.send).not.toHaveBeenCalled();

      env.CLOUDFRONT_DISTRIBUTION_ID = originalDistId;
    });

    it("should throw ApiError when bulk invalidation fails", async () => {
      const s3Keys = ["images/photo1.jpg", "images/photo2.jpg"];
      const cfError = new Error("CloudFront service error");

      cloudFront.send.mockRejectedValue(cfError);

      await expect(BulkInvalidateCloudFront(s3Keys)).rejects.toThrow(ApiError);
      await expect(BulkInvalidateCloudFront(s3Keys)).rejects.toThrow(
        "Failed to invalidate CDN cache",
      );
    });
  });
});
