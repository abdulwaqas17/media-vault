import rateLimit from 'express-rate-limit';
import { RateLimitHandler } from '../utils/RateLimitHandler.js';


console.log('====================================');
console.log("rate limit");
console.log('====================================');

// Global rate limiter - sab APIs par
export const RateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  
  standardHeaders: true, // Send Response headers
  legacyHeaders: false, //Old style headers disable.
  
handler: RateLimitHandler(),
});

// Auth routes ke liye strict limiter
export const AuthRateLimiter = rateLimit({
  windowMs:  60 * 10 * 1000, // 10 minutes
  max: 50, // Sirf 10 attempts
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: RateLimitHandler(),
});

// Admin routes ke liye
export const AdminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  
  standardHeaders: true,
  legacyHeaders: false,
  
 handler: RateLimitHandler(),
});

// Public directory search ke liye
export const SearchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  
 handler: RateLimitHandler(),
});


/*
user dobara request tab bhj sakta h jab windowMs ka time complete ho jaye.
*/