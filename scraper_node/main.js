const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const { authenticateRequest } = require('./utils/auth');
const { clerkAuthMiddleware, requireAuth } = require('./middleware/clerk');

// Import route handlers
const jobsRoutes = require('./routes/jobs');
const pipelinesRoutes = require('./routes/pipelines');
const dataflowRoutes = require('./routes/dataflow');
const downloadRoutes = require('./routes/download');
const callbackRoutes = require('./routes/callback');
const workflowsRoutes = require('./routes/workflows');
const workflowsCronRoutes = require('./routes/workflowsCron');
const credentialsRoutes = require('./routes/credentials');
const billingRoutes = require('./routes/billing');
const webhooksRoutes = require('./routes/webhooks');

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

// Webhook routes (must be BEFORE body parsing middleware)
// Stripe webhook needs raw body for signature verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksRoutes);

// Body parsing middleware (for JSON routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clerk authentication middleware
app.use(clerkAuthMiddleware);

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
      dataflow: {
        'POST /api/v1/dataflow/pipelines': 'Create a new data flow pipeline',
        'GET /api/v1/dataflow/pipelines': 'List data flow pipelines',
        'GET /api/v1/dataflow/pipelines/:id': 'Get data flow pipeline details',
        'POST /api/v1/dataflow/pipelines/:id/execute': 'Execute data flow pipeline',
        'GET /api/v1/dataflow/templates': 'Get available templates',
      },
      workflows: {
        'GET /api/v1/workflows': 'List user workflows',
        'GET /api/v1/workflows/:id': 'Get workflow details',
        'POST /api/v1/workflows': 'Create new workflow',
        'PUT /api/v1/workflows/:id': 'Update workflow',
        'DELETE /api/v1/workflows/:id': 'Delete workflow',
        'POST /api/v1/workflows/:id/publish': 'Publish workflow',
        'POST /api/v1/workflows/:id/unpublish': 'Unpublish workflow',
        'PUT /api/v1/workflows/:id/cron': 'Update workflow schedule',
        'DELETE /api/v1/workflows/:id/cron': 'Remove workflow schedule',
        'POST /api/v1/workflows/:id/duplicate': 'Duplicate workflow',
        'GET /api/v1/workflows/:id/executions': 'Get workflow executions',
      },
      credentials: {
        'GET /api/v1/credentials': 'List user credentials',
        'GET /api/v1/credentials/:id': 'Get credential details',
        'POST /api/v1/credentials': 'Create new credential',
        'DELETE /api/v1/credentials/:id': 'Delete credential',
      },
      billing: {
        'GET /api/v1/billing/credits': 'Get available credits',
        'POST /api/v1/billing/setup': 'Setup user account',
        'POST /api/v1/billing/purchase': 'Create purchase session',
        'GET /api/v1/billing/purchases': 'Get user purchases',
        'GET /api/v1/billing/purchases/:id/invoice': 'Get invoice URL',
      },
      webhooks: {
        'POST /api/v1/webhooks/stripe': 'Stripe webhook endpoint',
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

// API routes with Clerk authentication (for workflows, credentials, billing)
app.use('/api/v1/workflows', workflowsRoutes);
app.use('/api/v1/workflows', workflowsCronRoutes);
app.use('/api/v1/credentials', credentialsRoutes);
app.use('/api/v1/billing', billingRoutes);

// Legacy API routes with API key authentication (for jobs, pipelines, dataflow)
app.use('/api/v1/jobs', authenticate, jobsRoutes);
app.use('/api/v1/pipelines', authenticate, pipelinesRoutes);
app.use('/api/v1/dataflow', authenticate, dataflowRoutes);
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
