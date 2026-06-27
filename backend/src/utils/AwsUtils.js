import { s3, cloudFront } from "../config/Aws.js";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { ApiError } from "./ApiError.js";
import env from "../config/env.js";

export const DeleteFromS3 = async (s3Key) => {
  try {
    const deleteCmd = new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: s3Key,
    });

    await s3.send(deleteCmd);
  } catch (err) {
    console.error("Failed to delete from S3:", err);
    throw new ApiError(500, "Failed to delete media asset from S3");
  }
};

/**
 * Bulk delete objects from S3
 * @param {string[]} s3Keys
 */
export const BulkDeleteFromS3 = async (s3Keys) => {
  if (!s3Keys || s3Keys.length === 0) return;

  try {
    const deleteCmd = new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET_NAME,
      Delete: {
        Objects: s3Keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });

    await s3.send(deleteCmd);
    console.log(
      `Deleted ${s3Keys.length} objects from S3 ++++++++++++++++++++++++`,
    );
  } catch (err) {
    console.error("Failed to bulk delete from S3:", err);
    throw new ApiError(500, "Failed to delete media assets from S3");
  }
};

export const InvalidateCloudFront = async (s3Key) => {
  try {
    if (env.CLOUDFRONT_DISTRIBUTION_ID) {
      const invalidationCmd = new CreateInvalidationCommand({
        DistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: 1, // we can also invalite multple images by single function call
            Items: [`/${s3Key}`],
          },
        },
      });
      await cloudFront.send(invalidationCmd);
      console.log("CloudFront cache invalidated ++++++++++++++++++++++++");
    }
  } catch (err) {
    console.error("Failed to invalidate CloudFront cache:", err);
    throw new ApiError(500, "Failed to invalidate CDN cache");
  }
};

/**
 * Bulk invalidate paths on CloudFront
 * @param {string[]} s3Keys
 */
export const BulkInvalidateCloudFront = async (s3Keys) => {
  if (!s3Keys || s3Keys.length === 0) return;

  try {
    if (env.CLOUDFRONT_DISTRIBUTION_ID) {
      const invalidationCmd = new CreateInvalidationCommand({
        DistributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: s3Keys.length,
            Items: s3Keys.map((key) => (key.startsWith("/") ? key : `/${key}`)),
          },
        },
      });
      await cloudFront.send(invalidationCmd);
      console.log(
        `CloudFront bulk cache invalidated for ${s3Keys.length} items ++++++++++++++++++++++++`,
      );
    }
  } catch (err) {
    console.error("Failed to bulk invalidate CloudFront cache:", err);
    throw new ApiError(500, "Failed to invalidate CDN cache");
  }
};
