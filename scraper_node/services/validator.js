const Joi = require('joi');
const logger = require('../config/logger');

// Job creation validation schema
const createJobSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL must be a valid URI',
    'any.required': 'URL is required',
  }),
  options: Joi.object({
    // Legacy options
    selector: Joi.string().optional(),
    schema: Joi.object().optional(),
    waitTime: Joi.number().min(0).max(30).optional(),
    userAgent: Joi.string().optional(),
    headers: Joi.object().optional(),
    proxy: Joi.string().uri().optional(),
    
    // New Go server compatible options
    timeout: Joi.number().min(1).max(300).optional(), // in seconds
    enableJS: Joi.boolean().optional(),
    waitForElement: Joi.string().optional(),
    proxyURL: Joi.string().uri().optional(),
    maxRetries: Joi.number().min(0).max(10).optional(),
    retryDelay: Joi.number().min(1).max(60).optional(), // in seconds
    respectRobots: Joi.boolean().optional(),
    
    // Output format options
    outputFormat: Joi.string().valid('json', 'html', 'xml', 'md', 'csv').optional(),
    template: Joi.string().optional(),
    
    // Anti-bot and CAPTCHA options
    stealthMode: Joi.boolean().optional(),
    captchaSolver: Joi.string().valid('2captcha', 'anticaptcha', 'manual').optional(),
    captchaApiKey: Joi.string().optional(),
    randomDelay: Joi.boolean().optional(),
    minDelay: Joi.number().min(1).max(30).optional(), // in seconds
    maxDelay: Joi.number().min(1).max(30).optional(), // in seconds
    humanBehavior: Joi.boolean().optional(),
    viewportWidth: Joi.number().min(320).max(3840).optional(),
    viewportHeight: Joi.number().min(240).max(2160).optional(),
    disableImages: Joi.boolean().optional(),
    disableCSS: Joi.boolean().optional(),
    disableJS: Joi.boolean().optional(),
    webGLFingerprint: Joi.boolean().optional(),
    canvasFingerprint: Joi.boolean().optional(),
  }).optional(),
  callbackUrl: Joi.string().uri().optional().messages({
    'string.uri': 'callbackUrl must be a valid URI',
  }),
});

// Pipeline creation validation schema
const createPipelineSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must be at most 100 characters long',
    'any.required': 'Title is required',
  }),
  urls: Joi.array().items(Joi.string().uri()).min(1).max(1000).required().messages({
    'array.min': 'At least one URL is required',
    'array.max': 'Maximum 1000 URLs allowed',
    'any.required': 'URLs array is required',
  }),
  frequency: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').required().messages({
    'any.only': 'Frequency must be one of: hourly, daily, weekly, monthly',
    'any.required': 'Frequency is required',
  }),
  options: Joi.object({
    // Legacy options
    selector: Joi.string().optional(),
    schema: Joi.object().optional(),
    waitTime: Joi.number().min(0).max(30).optional(),
    userAgent: Joi.string().optional(),
    headers: Joi.object().optional(),
    proxy: Joi.string().uri().optional(),
    
    // New Go server compatible options
    timeout: Joi.number().min(1).max(300).optional(),
    enableJS: Joi.boolean().optional(),
    waitForElement: Joi.string().optional(),
    proxyURL: Joi.string().uri().optional(),
    maxRetries: Joi.number().min(0).max(10).optional(),
    retryDelay: Joi.number().min(1).max(60).optional(),
    respectRobots: Joi.boolean().optional(),
    
    // Output format options
    outputFormat: Joi.string().valid('json', 'html', 'xml', 'md', 'csv').optional(),
    template: Joi.string().optional(),
    
    // Anti-bot and CAPTCHA options
    stealthMode: Joi.boolean().optional(),
    captchaSolver: Joi.string().valid('2captcha', 'anticaptcha', 'manual').optional(),
    captchaApiKey: Joi.string().optional(),
    randomDelay: Joi.boolean().optional(),
    minDelay: Joi.number().min(1).max(30).optional(),
    maxDelay: Joi.number().min(1).max(30).optional(),
    humanBehavior: Joi.boolean().optional(),
    viewportWidth: Joi.number().min(320).max(3840).optional(),
    viewportHeight: Joi.number().min(240).max(2160).optional(),
    disableImages: Joi.boolean().optional(),
    disableCSS: Joi.boolean().optional(),
    disableJS: Joi.boolean().optional(),
    webGLFingerprint: Joi.boolean().optional(),
    canvasFingerprint: Joi.boolean().optional(),
  }).optional(),
});

// Callback validation schema
const callbackSchema = Joi.object({
  status: Joi.string().valid('completed', 'failed', 'running').required().messages({
    'any.only': 'Status must be one of: completed, failed, running',
    'any.required': 'Status is required',
  }),
  result: Joi.object({
    s3Location: Joi.string().optional(),
    data: Joi.object().optional(),
    error: Joi.string().optional(),
  }).optional(),
});

// API Key validation
const validateApiKey = (apiKey) => {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key is required',
    };
  }
  
  // Basic API key format validation (32 character alphanumeric)
  const apiKeyRegex = /^[a-zA-Z0-9]{32}$/;
  if (!apiKeyRegex.test(apiKey)) {
    return {
      isValid: false,
      error: 'Invalid API key format',
    };
  }
  
  return {
    isValid: true,
  };
};

// Generic validation function
const validate = (schema, data) => {
  try {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      logger.warn('Validation failed', { errors: errorMessages, data });
      return {
        isValid: false,
        errors: errorMessages,
        data: null,
      };
    }
    
    return {
      isValid: true,
      errors: null,
      data: value,
    };
  } catch (err) {
    logger.error('Validation error', { error: err.message, data });
    return {
      isValid: false,
      errors: ['Internal validation error'],
      data: null,
    };
  }
};

module.exports = {
  createJobSchema,
  createPipelineSchema,
  callbackSchema,
  validateApiKey,
  validate,
};
