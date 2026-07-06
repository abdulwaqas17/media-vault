import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { Provider, ROLES, UserStatus } from "../../constants/constants.js";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

/**
 * Handles user signup logic
 */
export const SignupService = async ({
  email,
  password,
  full_name,
  userAgent,
  ipAddress,
}) => {
  // Check if email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  // Hash user password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get default role (Member)
  const role = await prisma.roles.findUnique({
    where: { name: ROLES.Member },
  });

  if (!role) {
    throw new ApiError(500, "Default role not found");
  }

  // Create user and profile in single transaction
  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      provider: Provider.Local,

      role: {
        connect: { id: role.id },
      },

      profile: {
        create: {
          full_name,
        },
      },
    },
    include: {
      role: true,
      profile: true,
    },
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // create session with refresh token
  const session = await prisma.sessions.create({
    data: {
      user_id: user.id,
      refresh_token: hashedRefreshToken,
      user_agent: userAgent || "unknown",
      ip_address: ipAddress || "unknown",
      expires_at: expiresAt,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role.name,
    sessionId: session.id,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Handles Google authentication logic
 */
export const GoogleAuthService = async ({ idToken, userAgent, ipAddress }) => {
  const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  // Verify google token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { email, name } = payload;

  if (!email) {
    throw new ApiError(400, "Google account email not found");
  }

  // Check if user already exists
  let user = await prisma.users.findUnique({
    where: { email },
    include: {
      role: true,
      profile: true,
    },
  });

  // If user does not exist → create user
  if (!user) {
    // Get default role
    const role = await prisma.roles.findUnique({
      where: { name: ROLES.Member },
    });

    if (!role) {
      throw new ApiError(500, "Default role not found");
    }

    user = await prisma.users.create({
      data: {
        email,
        provider: Provider.Google,

        role: {
          connect: { id: role.id },
        },

        profile: {
          create: {
            full_name: name,
          },
        },
      },
      include: {
        role: true,
        profile: true,
      },
    });

    console.log("✅ New user created via Google Auth: ", user);
  }

  if (user && user.status === UserStatus.Inactive) {
    throw new ApiError(404,"Your account is Inactive")
  }

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // Session expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create session
  const session = await prisma.sessions.create({
    data: {
      user_id: user.id,
      refresh_token: hashedRefreshToken,
      user_agent: userAgent || "unknown",
      ip_address: ipAddress || "unknown",
      expires_at: expiresAt,
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role.name,
    sessionId: session.id,
  });

  console.log("✅ User logged in via Google Auth: ", user);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Login service
 */
export const LoginService = async ({
  email,
  password,
  userAgent,
  ipAddress,
}) => {
  // Check if user exists
  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      role: true,
      profile: true,
    },
  });

  if (user && user.status === UserStatus.Inactive) {
    throw new ApiError(404,"Your account is Inactive")
  }

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Ensure user registered via local provider
  if (user.provider === "Google" && !user.password) {
    throw new ApiError(400, "Please login using Google");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // Refresh token expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create session
  const session = await prisma.sessions.create({
    data: {
      user_id: user.id,
      refresh_token: hashedRefreshToken,
      user_agent: userAgent || "unknown",
      ip_address: ipAddress || "unknown",
      expires_at: expiresAt,
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role.name,
    sessionId: session.id,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * RefreshToken Service
 */
export const RefreshTokenService = async ({ accessToken, refreshToken }) => {
  //  Decode access token
  let decoded = jwt.decode(accessToken);
  if (!decoded?.sessionId) throw new ApiError(401,"Invalid access token");

  console.log("Decoded access token: ", decoded);

  // find session in db
  const session = await prisma.sessions.findUnique({
    where: { id: decoded.sessionId },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session) throw new ApiError(404, "Session not found");

  //  Check session active & not expired
  if (!session.is_active) throw new ApiError(403, "Session inactive");
  if (new Date() > session.expires_at)
    throw new ApiError(403, "Session expired");

  //  Compare refresh token (hashed in DB)
  const isTokenValid = await bcrypt.compare(
    refreshToken,
    session.refresh_token,
  );
  if (!isTokenValid) throw new ApiError(401, "Invalid refresh token");

  //  Check user active
  if (session.user.status !== UserStatus.Active)
    throw new ApiError(403, "User inactive");

  //  Generate new access token
  const newAccessToken = generateAccessToken({
    userId: session.user.id,
    role: session.user.role.name,
    sessionId: session.id,
  });

  return { accessToken: newAccessToken };
};


/**
 * LogoutService
 */
export const LogoutService = async ({ sessionId }) => {

  const session = await prisma.sessions.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  if (!session.is_active) {
    throw new ApiError(400, "Session already logged out");
  }

  // deactivate session
  await prisma.sessions.update({
    where: { id: sessionId },
    data: {
      is_active: false,
    },
  });

  return true;
};