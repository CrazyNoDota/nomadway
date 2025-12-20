const { verifyAccessToken } = require('../utils/auth');
const prisma = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        points: true,
        isActive: true,
        isDeleted: true,
      },
    });
    
    if (!user || !user.isActive || user.isDeleted) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found or inactive',
        },
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      req.user = null;
      return next();
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        points: true,
      },
    });
    
    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Admin Authorization Middleware
 * Requires user to have ADMIN role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
  next();
}

/**
 * Rate limiting by user
 */
const userRateLimits = new Map();

function userRateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!userRateLimits.has(userId)) {
      userRateLimits.set(userId, { count: 1, resetAt: now + windowMs });
      return next();
    }
    
    const limit = userRateLimits.get(userId);
    
    if (now > limit.resetAt) {
      limit.count = 1;
      limit.resetAt = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    }
    
    limit.count++;
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  userRateLimit,
};
