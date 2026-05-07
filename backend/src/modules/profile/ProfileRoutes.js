import express from "express";
import env from "../../config/env.js";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware.js";
import { ValidateAndSanitize } from "../../middlewares/ValidateMiddleware.js";
import * as ProfileValidation from "./ProfileValidation.js";
import * as ProfileController from "./ProfileController.js";
import {
  UploadMiddleware,
  UploadMemoryMiddleware,
} from "../../middlewares/UploadMiddleware.js";

const router = express.Router();

// Conditional upload middleware
const conditionalUpload = (req, res, next) => {
  if (env.USE_CDN === "false") {
    const upload = UploadMiddleware.single("image");
    // call manually middlware inside middlware, if return next() move forward, if error so stop and return error
    return upload(req, res, next);
  }
  // Parse multipart/form-data with memory storage to populate req.body when CDN is true
  return UploadMemoryMiddleware.single("image")(req, res, next);
};

// Conditional validation middleware
const conditionalValidation = (req, res, next) => {
  if (env.USE_CDN !== "false") {
    return ValidateAndSanitize(ProfileValidation.PresignedUrlSchema)(req, res, next);
  }
  console.log("conditionalValidation done");
  next();
};

/**
 * Get Presigned URL for media assets
 */
router.post(
  "/media-assets/presigned-url",
  // AuthMiddleware,
  conditionalUpload,
  conditionalValidation,
  ProfileController.PresignedUrlController,
);

/**
 * Update User Profile
 */
router.put(
  "/",
  AuthMiddleware,
  ValidateAndSanitize(ProfileValidation.UpdateProfileSchema),
  ProfileController.UpdateProfileController,
);

/**
 * Get My Profile
 */
router.get("/me", AuthMiddleware, ProfileController.GetMyProfileController);

export default router;
