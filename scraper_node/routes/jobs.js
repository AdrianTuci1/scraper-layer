const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { validate, createJobSchema } = require('../services/validator');
const { createJob, getJob, getUserJobs } = require('../services/dynamodb');
const { sendScrapingJob } = require('../services/sqs');
const {
  success,
  error,
  validationError,
  notFound,
  accepted,
  internalError,
} = require('../utils/response');

const router = express.Router();

// Create a new scraping job
router.post('/', async (req, res) => {
  try {
    logger.info('Creating new scraping job', { userId: req.userContext?.userId });
    
    // Validate request data
    const validation = validate(createJobSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json(validationError(validation.errors));
    }
    
    const { url, options = {}, callbackUrl } = validation.data;
    const userId = req.userContext.userId;
    const jobId = uuidv4();
    
    // Create job record in DynamoDB
    const jobData = {
      jobId,
      userId,
      url,
      options,
      callbackUrl,
    };
    
    await createJob(jobData);
    
    // Send job to SQS for processing
    await sendScrapingJob(jobData);
    
    // Return accepted response with job ID
    const response = accepted({
      jobId,
      status: 'pending',
      message: 'Job created successfully and queued for processing',
    });
    
    return res.status(202).json(response);
  } catch (error) {
    logger.error('Failed to create job', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to create scraping job'));
  }
});

// Get job details
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userContext.userId;
    
    if (!jobId) {
      return res.status(400).json(validationError(['Job ID is required']));
    }
    
    logger.info('Getting job details', { jobId, userId });
    
    // Get job from DynamoDB
    const result = await getJob(jobId);
    
    if (!result.success) {
      return res.status(404).json(notFound('Job'));
    }
    
    // Check if user owns this job
    if (result.data.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Return job details (exclude sensitive data)
    const jobDetails = {
      jobId: result.data.job_id,
      status: result.data.status,
      url: result.data.url,
      options: result.data.options,
      callbackUrl: result.data.callback_url,
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
      s3Location: result.data.s3_location,
      errorMessage: result.data.error_message,
    };
    
    return res.status(200).json(success(jobDetails));
  } catch (error) {
    logger.error('Failed to get job', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to retrieve job details'));
  }
});

// List user's jobs with pagination
router.get('/', async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const { limit = 50, lastEvaluatedKey, status } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 items
    const lastKey = lastEvaluatedKey ? 
      JSON.parse(decodeURIComponent(lastEvaluatedKey)) : null;
    
    logger.info('Listing user jobs', { userId, limit: limitNum });
    
    // Get user jobs from DynamoDB
    const result = await getUserJobs(userId, limitNum, lastKey);
    
    // Filter by status if provided
    let jobs = result.data;
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    // Format jobs for response
    const formattedJobs = jobs.map(job => ({
      jobId: job.job_id,
      status: job.status,
      url: job.url,
      options: job.options,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      s3Location: job.s3_location,
      errorMessage: job.error_message,
    }));
    
    const response = success({
      jobs: formattedJobs,
      pagination: {
        count: formattedJobs.length,
        limit: limitNum,
        lastEvaluatedKey: result.lastEvaluatedKey,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to list jobs', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to retrieve job list'));
  }
});

module.exports = router;
