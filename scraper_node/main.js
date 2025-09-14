const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const { authenticateRequest } = require('./utils/auth');

// Import route handlers
const jobsRoutes = require('./routes/jobs');
const pipelinesRoutes = require('./routes/pipelines');
const downloadRoutes = require('./routes/download');
const callbackRoutes = require('./routes/callback');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Scraper Node.js API is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Scraper Layer API',
    version: '1.0.0',
    endpoints: {
      jobs: {
        'POST /api/v1/jobs': 'Create a new scraping job',
        'GET /api/v1/jobs': 'List user jobs',
        'GET /api/v1/jobs/:jobId': 'Get job details',
        'GET /api/v1/jobs/:jobId/download': 'Download job results',
      },
      pipelines: {
        'POST /api/v1/pipelines': 'Create a new data pipeline',
        'GET /api/v1/pipelines': 'List user pipelines',
        'GET /api/v1/pipelines/:pipelineId': 'Get pipeline details',
      },
      callback: {
        'POST /api/v1/jobs/:jobId/callback': 'Worker callback endpoint',
      },
    },
    documentation: 'https://docs.scraperlayer.com',
  });
});

// Authentication middleware for protected routes
const authenticate = (req, res, next) => {
  const auth = authenticateRequest({
    headers: req.headers,
    queryStringParameters: req.query,
  });

  if (!auth.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: {
        message: auth.error,
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Add user context to request
  req.userContext = {
    userId: auth.userId,
    apiKey: auth.apiKey,
  };

  next();
};

// API routes with authentication
app.use('/api/v1/jobs', authenticate, jobsRoutes);
app.use('/api/v1/pipelines', authenticate, pipelinesRoutes);
app.use('/api/v1/jobs', authenticate, downloadRoutes);

// Callback routes (no authentication required - used by Golang workers)
app.use('/api/v1/jobs', callbackRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      statusCode: err.status || 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack }),
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Scraper Node.js API server running on port ${PORT}`);
  logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📖 API docs: http://localhost:${PORT}/api`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;
