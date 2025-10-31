const { clerkMiddleware, getAuth } = require('@clerk/express');
const logger = require('../config/logger');

// Clerk middleware configuration
const clerkAuthMiddleware = clerkMiddleware({
  // Clerk will automatically validate the session token from Authorization header
  // and attach user info to req.auth
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Middleware to extract userId from Clerk auth
const requireAuth = (req, res, next) => {
  try {
    const auth = getAuth(req);
    
    // Debug logging
    logger.debug('Auth check', { 
      hasAuth: !!auth, 
      userId: auth?.userId,
      path: req.path,
      method: req.method 
    });
    
    if (!auth || !auth.userId) {
      logger.warn('Unauthorized request', { path: req.path, method: req.method });
      return res.status(401).json({
        success: false,
        error: {
          message: 'Unauthorized - Authentication required',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add user context to request
    req.userContext = {
      userId: auth.userId,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message, stack: error.stack });
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = {
  clerkAuthMiddleware,
  requireAuth,
};

