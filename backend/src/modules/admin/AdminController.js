import * as AdminService from "./AdminService.js";
import { SendResponse } from "../../utils/ApiResponse.js";

/**
 * Controller: Toggle user status (ACTIVE <-> INACTIVE)
 * Only Admin can perform this action
 * 
 * @param req.params.userId - Target user ID
 * @returns Updated user status
 */
export const ToggleUserStatusController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Call service to toggle user status
    const updatedUser = await AdminService.ToggleUserStatusService(userId);

    return SendResponse(res, 200, "User status updated successfully", updatedUser);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

/**
 * Controller: Permanently delete a user
 * - Removes user from DB
 * - Deletes profile
 * - Revokes all sessions
 * - Deletes media assets from S3 & clears CDN cache
 */
export const DeleteUserController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Call service to handle full deletion
    await AdminService.DeleteUserService(userId,req);

    return SendResponse(res, 200, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};