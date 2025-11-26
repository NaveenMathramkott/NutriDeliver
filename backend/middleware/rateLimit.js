import rateLimit from 'express-rate-limit';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Payment endpoint rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API key based rate limiting for restaurants/riders
export const createUserSpecificLimiter = (maxRequests = 100) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.user ? req.user.id : req.ip;
    },
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};