import { Router } from "express";
import * as SessionController from "./SessionController.js";
import { ValidateAndSanitize } from "../../middlewares/ValidateMiddleware.js";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware.js";
import * as SessionsSchema from "./SessionValidation.js";
import { ROLES } from "../../constants/constants.js";
import { RoleMiddleware } from "../../middlewares/RoleMiddleware.js";

const router = Router();

// api/sessions/

/**
 * Get all sessions of a user
 */
router.get(
  "/user/:userId",
  AuthMiddleware,
  RoleMiddleware(ROLES.Admin),
  ValidateAndSanitize(SessionsSchema.GetUserSessionsSchema, "params"),
  SessionController.GetUserSessionsController,
);

/**
 * Revoke a specific session of a user
 */
router.patch(
  "/user/:userId/:sessionId/revoke",
  AuthMiddleware,
  RoleMiddleware(ROLES.Admin),
  ValidateAndSanitize(SessionsSchema.RevokeSessionSchema, "params"),
  SessionController.RevokeSessionController,
);

/**
 * Revoke all sessions of a user
 */
router.patch(
  "/user/:userId/revoke-all",
  AuthMiddleware,
  RoleMiddleware(ROLES.Admin),
  ValidateAndSanitize(SessionsSchema.RevokeAllSessionsSchema, "params"),
  SessionController.RevokeAllSessionsController,
);

export default router;
