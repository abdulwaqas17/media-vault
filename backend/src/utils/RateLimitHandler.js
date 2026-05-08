/**
 * Custom rate limit response handler
 */
export const RateLimitHandler = (
  customMessage = "Too many requests. Please try again later.",
) => {
  return (req, res, next, options) => {

    console.log('====================================');
    console.log("Rate limit hit for IP:", req.ip);
    console.log("Request path:", req.rateLimit);

    console.log('====================================');

    // Calculate actual remaining time
    const remainingMs =
      req.rateLimit.resetTime.getTime() - Date.now();

    const retryAfterSeconds =
      Math.ceil(remainingMs / 1000);

    return res.status(options.statusCode).json({
      success: false,
      message: `${customMessage}`,
      retryAfter: `${retryAfterSeconds} seconds`,
    });
  };
};