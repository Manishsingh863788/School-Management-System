import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication endpoints (prevent brute-force attacks)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    errors: [],
  },
});

// Standard API rate limiter
export const standardRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    errors: [],
  },
});
