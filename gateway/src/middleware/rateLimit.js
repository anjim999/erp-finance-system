// Rate Limiting Configuration for Vyapar360 Gateway
// Protects APIs from abuse and ensures fair usage

import rateLimit from 'express-rate-limit';

// ============================================
// GLOBAL RATE LIMITER
// Applies to all requests
// ============================================
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes per IP
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Use default keyGenerator (handles IPv6 properly)
    validate: { xForwardedForHeader: false }
});

// ============================================
// AUTH RATE LIMITER
// Stricter limits for login/register to prevent brute force
// ============================================
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 login attempts per 15 minutes
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    validate: { xForwardedForHeader: false }
});

// ============================================
// API RATE LIMITER
// For general API endpoints
// ============================================
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: {
        success: false,
        error: 'API rate limit exceeded. Please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
});

// ============================================
// STRICT RATE LIMITER
// For sensitive operations (password reset, OTP, etc.)
// ============================================
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Only 5 attempts per hour
    message: {
        success: false,
        error: 'Too many attempts for this sensitive operation. Please try again in an hour.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
});
