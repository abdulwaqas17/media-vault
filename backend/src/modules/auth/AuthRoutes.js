import express from "express";
import * as AuthController from "./AuthController.js";
import * as AuthSchema from "./AuthValidation.js";
import { ValidateAndSanitize } from "../../middlewares/ValidateMiddleware.js";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware.js";

const router = express.Router();

// api/auth/

/**
 * Create new user account
 */
router.post(
  "/signup",
  ValidateAndSanitize(AuthSchema.SignupSchema),
  AuthController.SignupController,
);

/**
 * Authenticate user with Google
 */
router.post(
  "/google",
  ValidateAndSanitize(AuthSchema.GoogleAuthSchema),
  AuthController.GoogleAuthController,
);

/**
 * ain route
 */
router.post(
  "/login",
  ValidateAndSanitize(AuthSchema.LoginSchema),
  AuthController.LoginController,
);

/**
 * Get new access token using refresh token
 */
router.post("/refresh-token", AuthController.RefreshTokenController);

/**
 * Logout route
 */
router.post(
  "/logout",
  AuthMiddleware,
  AuthController.LogoutController
);

export default router;
