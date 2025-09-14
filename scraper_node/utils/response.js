const logger = require('../config/logger');

const createResponse = (statusCode, body, headers = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
  
  const response = {
    statusCode,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
  
  // Log response for debugging
  logger.debug('API Response', { statusCode, body });
  
  return response;
};

const success = (data, statusCode = 200) => {
  return createResponse(statusCode, {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

const error = (message, statusCode = 400, details = null) => {
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  };
  
  if (details) {
    errorResponse.error.details = details;
  }
  
  // Log error for monitoring
  logger.error('API Error Response', {
    message,
    statusCode,
    details,
  });
  
  return createResponse(statusCode, errorResponse);
};

const validationError = (errors) => {
  return error('Validation failed', 400, {
    validationErrors: errors,
  });
};

const notFound = (resource = 'Resource') => {
  return error(`${resource} not found`, 404);
};

const unauthorized = (message = 'Unauthorized access') => {
  return error(message, 401);
};

const forbidden = (message = 'Access forbidden') => {
  return error(message, 403);
};

const internalError = (message = 'Internal server error') => {
  return error(message, 500);
};

const accepted = (data) => {
  return success(data, 202);
};

const created = (data) => {
  return success(data, 201);
};

const noContent = () => {
  return createResponse(204, '');
};

// Handle Lambda proxy integration response
const handleLambdaResponse = (callback, response) => {
  try {
    callback(null, response);
  } catch (error) {
    logger.error('Failed to send Lambda response', { error: error.message });
    callback(error);
  }
};

module.exports = {
  createResponse,
  success,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  internalError,
  accepted,
  created,
  noContent,
  handleLambdaResponse,
};
