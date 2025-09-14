const { dynamodb } = require('../config/aws');
const logger = require('../config/logger');

const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE;
const PIPELINES_TABLE = process.env.DYNAMODB_PIPELINES_TABLE;

// Jobs table operations
const createJob = async (jobData) => {
  try {
    const params = {
      TableName: JOBS_TABLE,
      Item: {
        job_id: jobData.jobId,
        user_id: jobData.userId,
        status: 'pending',
        url: jobData.url,
        options: jobData.options || {},
        callback_url: jobData.callbackUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        s3_location: null,
        error_message: null,
      },
    };
    
    await dynamodb.put(params).promise();
    logger.info('Job created successfully', { jobId: jobData.jobId });
    
    return {
      success: true,
      data: params.Item,
    };
  } catch (error) {
    logger.error('Failed to create job', { error: error.message, jobData });
    throw error;
  }
};

const getJob = async (jobId) => {
  try {
    const params = {
      TableName: JOBS_TABLE,
      Key: {
        job_id: jobId,
      },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        success: false,
        error: 'Job not found',
        data: null,
      };
    }
    
    return {
      success: true,
      data: result.Item,
    };
  } catch (error) {
    logger.error('Failed to get job', { error: error.message, jobId });
    throw error;
  }
};

const updateJobStatus = async (jobId, status, additionalData = {}) => {
  try {
    const updateExpression = 'SET #status = :status, updated_at = :updated_at';
    const expressionAttributeNames = {
      '#status': 'status',
    };
    const expressionAttributeValues = {
      ':status': status,
      ':updated_at': new Date().toISOString(),
    };
    
    // Add additional fields if provided
    if (additionalData.s3Location) {
      updateExpression += ', s3_location = :s3_location';
      expressionAttributeValues[':s3_location'] = additionalData.s3Location;
    }
    
    if (additionalData.errorMessage) {
      updateExpression += ', error_message = :error_message';
      expressionAttributeValues[':error_message'] = additionalData.errorMessage;
    }
    
    const params = {
      TableName: JOBS_TABLE,
      Key: {
        job_id: jobId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
    
    const result = await dynamodb.update(params).promise();
    logger.info('Job status updated', { jobId, status });
    
    return {
      success: true,
      data: result.Attributes,
    };
  } catch (error) {
    logger.error('Failed to update job status', { error: error.message, jobId, status });
    throw error;
  }
};

const getUserJobs = async (userId, limit = 50, lastEvaluatedKey = null) => {
  try {
    const params = {
      TableName: JOBS_TABLE,
      IndexName: 'user-status-index',
      KeyConditionExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': userId,
      },
      Limit: limit,
      ScanIndexForward: false, // Sort by created_at descending
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    const result = await dynamodb.query(params).promise();
    
    return {
      success: true,
      data: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count,
    };
  } catch (error) {
    logger.error('Failed to get user jobs', { error: error.message, userId });
    throw error;
  }
};

// Pipelines table operations
const createPipeline = async (pipelineData) => {
  try {
    const params = {
      TableName: PIPELINES_TABLE,
      Item: {
        pipeline_id: pipelineData.pipelineId,
        user_id: pipelineData.userId,
        title: pipelineData.title,
        urls: pipelineData.urls,
        frequency: pipelineData.frequency,
        options: pipelineData.options || {},
        last_run_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
    };
    
    await dynamodb.put(params).promise();
    logger.info('Pipeline created successfully', { pipelineId: pipelineData.pipelineId });
    
    return {
      success: true,
      data: params.Item,
    };
  } catch (error) {
    logger.error('Failed to create pipeline', { error: error.message, pipelineData });
    throw error;
  }
};

const getPipeline = async (pipelineId) => {
  try {
    const params = {
      TableName: PIPELINES_TABLE,
      Key: {
        pipeline_id: pipelineId,
      },
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        success: false,
        error: 'Pipeline not found',
        data: null,
      };
    }
    
    return {
      success: true,
      data: result.Item,
    };
  } catch (error) {
    logger.error('Failed to get pipeline', { error: error.message, pipelineId });
    throw error;
  }
};

const getUserPipelines = async (userId, limit = 50, lastEvaluatedKey = null) => {
  try {
    const params = {
      TableName: PIPELINES_TABLE,
      IndexName: 'user-frequency-index',
      KeyConditionExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': userId,
      },
      Limit: limit,
      ScanIndexForward: false,
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    const result = await dynamodb.query(params).promise();
    
    return {
      success: true,
      data: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count,
    };
  } catch (error) {
    logger.error('Failed to get user pipelines', { error: error.message, userId });
    throw error;
  }
};

const updatePipelineLastRun = async (pipelineId) => {
  try {
    const params = {
      TableName: PIPELINES_TABLE,
      Key: {
        pipeline_id: pipelineId,
      },
      UpdateExpression: 'SET last_run_at = :last_run_at, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':last_run_at': new Date().toISOString(),
        ':updated_at': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };
    
    const result = await dynamodb.update(params).promise();
    logger.info('Pipeline last run updated', { pipelineId });
    
    return {
      success: true,
      data: result.Attributes,
    };
  } catch (error) {
    logger.error('Failed to update pipeline last run', { error: error.message, pipelineId });
    throw error;
  }
};

const getActivePipelinesForSchedule = async (frequency, limit = 100) => {
  try {
    const params = {
      TableName: PIPELINES_TABLE,
      IndexName: 'frequency-lastrun-index',
      KeyConditionExpression: 'frequency = :frequency',
      FilterExpression: 'is_active = :is_active',
      ExpressionAttributeValues: {
        ':frequency': frequency,
        ':is_active': true,
      },
      Limit: limit,
    };
    
    const result = await dynamodb.query(params).promise();
    
    return {
      success: true,
      data: result.Items,
      count: result.Count,
    };
  } catch (error) {
    logger.error('Failed to get active pipelines for schedule', { error: error.message, frequency });
    throw error;
  }
};

module.exports = {
  // Jobs operations
  createJob,
  getJob,
  updateJobStatus,
  getUserJobs,
  
  // Pipelines operations
  createPipeline,
  getPipeline,
  getUserPipelines,
  updatePipelineLastRun,
  getActivePipelinesForSchedule,
};
