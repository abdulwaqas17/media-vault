import { Router } from "express";
import { SendResponse } from "../utils/ApiResponse.js";

// Import module-specific routers 
import authRoutes from "../modules/auth/AuthRoutes.js";
import sessionRoutes from "../modules/session/SessionRoutes.js";
import profileRoutes from "../modules/profile/ProfileRoutes.js";
import adminRoutes from "../modules/admin/AdminRoutes.js"; 
import networkRoutes from "../modules/network/NetworkRoutes.js"; 
import { AdminRateLimiter, AuthRateLimiter, SearchRateLimiter } from "../config/rateLimit.js";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  SendResponse(res, 200, "API is running");
});

// Module Routers
router.use("/auth",AuthRateLimiter, authRoutes);
router.use("/session", sessionRoutes);
router.use("/profile", profileRoutes);
router.use("/admin", AdminRateLimiter, adminRoutes);
router.use("/network", SearchRateLimiter, networkRoutes);

export default router;