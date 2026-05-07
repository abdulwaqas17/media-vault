import express from "express";
import * as AdminController from "./AdminController.js";
import { AuthMiddleware } from "../../middlewares/AuthMiddleware.js";
import { RoleMiddleware } from "../../middlewares/RoleMiddleware.js";
import { ValidateAndSanitize } from "../../middlewares/ValidateMiddleware.js";
import * as AdminSchemaValidation from "./AdminValidation.js";
import { ROLES } from "../../constants/constants.js";

const router = express.Router();

/**
 * @route   PATCH /api/admin/users/:userId/deactivate
 * @desc    Toggle user status (ACTIVE <-> INACTIVE)
 *          If setting to INACTIVE, revoke all sessions of the user
 * @access  Admin only
 */
router.patch(
  "/users/:userId/deactivate",
  AuthMiddleware,
  RoleMiddleware(ROLES.Admin),
  ValidateAndSanitize(AdminSchemaValidation.UserStatusSchema, "params"), // validate userId param
  AdminController.ToggleUserStatusController,
);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Permanently delete a user and all associated data
 * @access  Admin only
 */
router.delete(
  "/users/:userId",
  AuthMiddleware,
  RoleMiddleware(ROLES.Admin),
  ValidateAndSanitize(AdminSchemaValidation.UserStatusSchema, "params"), // validate userId param
  AdminController.DeleteUserController,
);
export default router;
