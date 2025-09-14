// Test setup file
// This file is run before each test file

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      scan: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    })),
  },
  SQS: jest.fn(() => ({
    sendMessage: jest.fn().mockReturnThis(),
    sendMessageBatch: jest.fn().mockReturnThis(),
    getQueueAttributes: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  })),
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnThis(),
    getSignedUrlPromise: jest.fn(),
    headObject: jest.fn().mockReturnThis(),
    deleteObject: jest.fn().mockReturnThis(),
    listObjectsV2: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  })),
  EventBridge: jest.fn(() => ({
    putEvents: jest.fn().mockReturnThis(),
    putRule: jest.fn().mockReturnThis(),
    putTargets: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  })),
  config: {
    update: jest.fn(),
  },
}));

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Set environment variables for tests
process.env.DYNAMODB_JOBS_TABLE = 'test-jobs-table';
process.env.DYNAMODB_PIPELINES_TABLE = 'test-pipelines-table';
process.env.SQS_QUEUE_URL = 'test-queue-url';
process.env.S3_BUCKET = 'test-bucket';
process.env.STAGE = 'test';
process.env.REGION = 'us-east-1';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(10000);
