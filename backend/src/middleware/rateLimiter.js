const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes rate limiter (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Order placement rate limiter
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 orders per minute
  message: {
    success: false,
    error: 'Too many order attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Product operations rate limiter (admin only) - more lenient
const productLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 product operations per minute (increased from 10)
  message: {
    success: false,
    error: 'Too many product operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin-specific rate limiter (very lenient for admin operations)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 admin operations per minute
  message: {
    success: false,
    error: 'Too many admin operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, orderLimiter, productLimiter, adminLimiter }; 