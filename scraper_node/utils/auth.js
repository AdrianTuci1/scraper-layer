const { validateApiKey } = require('../services/validator');
const logger = require('../config/logger');

// Extract API key from various sources
const extractApiKey = (event) => {
  // Try to get from headers first
  if (event.headers && event.headers['x-api-key']) {
    return event.headers['x-api-key'];
  }
  
  // Try from Authorization header (Bearer token format)
  if (event.headers && event.headers.Authorization) {
    const authHeader = event.headers.Authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return authHeader;
  }
  
  // Try from query parameters (for testing purposes)
  if (event.queryStringParameters && event.queryStringParameters.apiKey) {
    return event.queryStringParameters.apiKey;
  }
  
  return null;
};

// Extract user ID from API key (for MVP, we'll use a simple mapping)
const extractUserIdFromApiKey = (apiKey) => {
  // For MVP, we'll use a simple approach where the first 8 characters of the API key
  // represent the user ID. In production, this should be a proper lookup in a database.
  
  if (!apiKey || apiKey.length < 8) {
    return null;
  }
  
  // Simple user ID extraction (first 8 characters)
  const userId = apiKey.substring(0, 8);
  
  logger.debug('Extracted user ID from API key', { userId, apiKeyLength: apiKey.length });
  
  return userId;
};

// Authenticate request
const authenticateRequest = (event) => {
  try {
    const apiKey = extractApiKey(event);
    
    if (!apiKey) {
      return {
        isAuthenticated: false,
        error: 'API key is required',
        userId: null,
      };
    }
    
    const validation = validateApiKey(apiKey);
    
    if (!validation.isValid) {
      return {
        isAuthenticated: false,
        error: validation.error,
        userId: null,
      };
    }
    
    const userId = extractUserIdFromApiKey(apiKey);
    
    if (!userId) {
      return {
        isAuthenticated: false,
        error: 'Invalid user ID from API key',
        userId: null,
      };
    }
    
    logger.debug('Request authenticated successfully', { userId });
    
    return {
      isAuthenticated: true,
      error: null,
      userId,
      apiKey,
    };
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return {
      isAuthenticated: false,
      error: 'Authentication failed',
      userId: null,
    };
  }
};

// Middleware function for Lambda handlers
const withAuth = (handler) => {
  return async (event, context, callback) => {
    const auth = authenticateRequest(event);
    
    if (!auth.isAuthenticated) {
      const { unauthorized } = require('./response');
      return unauthorized(auth.error);
    }
    
    // Add user context to event
    event.userContext = {
      userId: auth.userId,
      apiKey: auth.apiKey,
    };
    
    return handler(event, context, callback);
  };
};

module.exports = {
  extractApiKey,
  extractUserIdFromApiKey,
  authenticateRequest,
  withAuth,
};
