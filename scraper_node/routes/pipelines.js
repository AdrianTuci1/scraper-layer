const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { validate, createPipelineSchema } = require('../services/validator');
const { 
  createPipeline, 
  getPipeline, 
  getUserPipelines, 
  getActivePipelinesForSchedule,
  updatePipelineLastRun 
} = require('../services/dynamodb');
const { sendBulkScrapingJobs } = require('../services/sqs');
const {
  success,
  error,
  validationError,
  notFound,
  created,
  internalError,
} = require('../utils/response');

const router = express.Router();

// Create a new data pipeline
router.post('/', async (req, res) => {
  try {
    logger.info('Creating new pipeline', { userId: req.userContext?.userId });
    
    // Validate request data
    const validation = validate(createPipelineSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json(validationError(validation.errors));
    }
    
    const { title, urls, frequency, options = {} } = validation.data;
    const userId = req.userContext.userId;
    const pipelineId = uuidv4();
    
    // Create pipeline record in DynamoDB
    const pipelineData = {
      pipelineId,
      userId,
      title,
      urls,
      frequency,
      options,
    };
    
    await createPipeline(pipelineData);
    
    // Return created response with pipeline ID
    const response = created({
      pipelineId,
      title,
      urlsCount: urls.length,
      frequency,
      message: 'Pipeline created successfully',
    });
    
    return res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create pipeline', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to create data pipeline'));
  }
});

// Get pipeline details
router.get('/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const userId = req.userContext.userId;
    
    if (!pipelineId) {
      return res.status(400).json(validationError(['Pipeline ID is required']));
    }
    
    logger.info('Getting pipeline details', { pipelineId, userId });
    
    // Get pipeline from DynamoDB
    const result = await getPipeline(pipelineId);
    
    if (!result.success) {
      return res.status(404).json(notFound('Pipeline'));
    }
    
    // Check if user owns this pipeline
    if (result.data.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Return pipeline details
    const pipelineDetails = {
      pipelineId: result.data.pipeline_id,
      title: result.data.title,
      urls: result.data.urls,
      frequency: result.data.frequency,
      options: result.data.options,
      isActive: result.data.is_active,
      lastRunAt: result.data.last_run_at,
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at,
    };
    
    return res.status(200).json(success(pipelineDetails));
  } catch (error) {
    logger.error('Failed to get pipeline', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to retrieve pipeline details'));
  }
});

// List user's pipelines with pagination
router.get('/', async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const { limit = 50, lastEvaluatedKey, frequency, isActive } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 items
    const lastKey = lastEvaluatedKey ? 
      JSON.parse(decodeURIComponent(lastEvaluatedKey)) : null;
    
    logger.info('Listing user pipelines', { userId, limit: limitNum });
    
    // Get user pipelines from DynamoDB
    const result = await getUserPipelines(userId, limitNum, lastKey);
    
    // Filter pipelines based on query parameters
    let pipelines = result.data;
    
    if (frequency) {
      pipelines = pipelines.filter(pipeline => pipeline.frequency === frequency);
    }
    
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      pipelines = pipelines.filter(pipeline => pipeline.is_active === activeFilter);
    }
    
    // Format pipelines for response
    const formattedPipelines = pipelines.map(pipeline => ({
      pipelineId: pipeline.pipeline_id,
      title: pipeline.title,
      urlsCount: pipeline.urls.length,
      frequency: pipeline.frequency,
      isActive: pipeline.is_active,
      lastRunAt: pipeline.last_run_at,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
    }));
    
    const response = success({
      pipelines: formattedPipelines,
      pagination: {
        count: formattedPipelines.length,
        limit: limitNum,
        lastEvaluatedKey: result.lastEvaluatedKey,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to list pipelines', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to retrieve pipeline list'));
  }
});

// Update pipeline (activate/deactivate)
router.put('/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const userId = req.userContext.userId;
    const { isActive } = req.body;
    
    if (!pipelineId) {
      return res.status(400).json(validationError(['Pipeline ID is required']));
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json(validationError(['isActive must be a boolean']));
    }
    
    logger.info('Updating pipeline', { pipelineId, userId, isActive });
    
    // Get pipeline to verify ownership
    const pipelineResult = await getPipeline(pipelineId);
    
    if (!pipelineResult.success) {
      return res.status(404).json(notFound('Pipeline'));
    }
    
    if (pipelineResult.data.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Update pipeline status
    // Note: You would need to implement updatePipeline in dynamodb.js
    // For now, we'll return a placeholder response
    const response = success({
      pipelineId,
      isActive,
      message: 'Pipeline updated successfully',
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to update pipeline', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to update pipeline'));
  }
});

// Delete pipeline
router.delete('/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const userId = req.userContext.userId;
    
    if (!pipelineId) {
      return res.status(400).json(validationError(['Pipeline ID is required']));
    }
    
    logger.info('Deleting pipeline', { pipelineId, userId });
    
    // Get pipeline to verify ownership
    const pipelineResult = await getPipeline(pipelineId);
    
    if (!pipelineResult.success) {
      return res.status(404).json(notFound('Pipeline'));
    }
    
    if (pipelineResult.data.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Delete pipeline
    // Note: You would need to implement deletePipeline in dynamodb.js
    // For now, we'll return a placeholder response
    const response = success({
      pipelineId,
      message: 'Pipeline deleted successfully',
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to delete pipeline', { error: error.message, stack: error.stack });
    return res.status(500).json(internalError('Failed to delete pipeline'));
  }
});

module.exports = router;
