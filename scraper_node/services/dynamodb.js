const { dynamodb } = require('../config/aws');
const logger = require('../config/logger');

const JOBS_TABLE = process.env.DYNAMODB_JOBS_TABLE;
const PIPELINES_TABLE = process.env.DYNAMODB_PIPELINES_TABLE;
const DATAFLOW_PIPELINES_TABLE = process.env.DYNAMODB_DATAFLOW_PIPELINES_TABLE || 'dataflow_pipelines';

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

// Data Flow Pipelines operations
const saveDataFlowPipeline = async (pipelineData) => {
  try {
    const params = {
      TableName: DATAFLOW_PIPELINES_TABLE,
      Item: {
        pipeline_id: pipelineData.id,
        user_id: pipelineData.userId,
        name: pipelineData.name,
        description: pipelineData.description,
        template: pipelineData.template,
        status: pipelineData.status,
        start_url: pipelineData.startUrl,
        steps: pipelineData.steps,
        config: pipelineData.config,
        created_at: pipelineData.createdAt,
        updated_at: pipelineData.updatedAt,
        execution_history: pipelineData.executionHistory || []
      }
    };

    await dynamodb.put(params).promise();
    logger.info('Data flow pipeline saved successfully', { pipelineId: pipelineData.id });

    return { success: true, data: params.Item };
  } catch (error) {
    logger.error('Failed to save data flow pipeline', { error: error.message, pipelineData });
    throw error;
  }
};

const getDataFlowPipeline = async (pipelineId, userId) => {
  try {
    const params = {
      TableName: DATAFLOW_PIPELINES_TABLE,
      Key: {
        pipeline_id: pipelineId,
        user_id: userId
      }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return null;
    }

    return {
      id: result.Item.pipeline_id,
      name: result.Item.name,
      description: result.Item.description,
      template: result.Item.template,
      status: result.Item.status,
      startUrl: result.Item.start_url,
      steps: result.Item.steps,
      config: result.Item.config,
      userId: result.Item.user_id,
      createdAt: result.Item.created_at,
      updatedAt: result.Item.updated_at,
      executionHistory: result.Item.execution_history || []
    };
  } catch (error) {
    logger.error('Failed to get data flow pipeline', { error: error.message, pipelineId, userId });
    throw error;
  }
};

const getDataFlowPipelines = async (userId, options = {}) => {
  try {
    const params = {
      TableName: DATAFLOW_PIPELINES_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by created_at descending
      Limit: options.limit || 20
    };

    // Add filters if provided
    if (options.status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = options.status;
    }

    if (options.template) {
      const filterExpr = params.FilterExpression ? `${params.FilterExpression} AND template = :template` : 'template = :template';
      params.FilterExpression = filterExpr;
      params.ExpressionAttributeValues[':template'] = options.template;
    }

    const result = await dynamodb.query(params).promise();

    return result.Items.map(item => ({
      id: item.pipeline_id,
      name: item.name,
      description: item.description,
      template: item.template,
      status: item.status,
      startUrl: item.start_url,
      steps: item.steps,
      config: item.config,
      userId: item.user_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      executionHistory: item.execution_history || []
    }));
  } catch (error) {
    logger.error('Failed to get data flow pipelines', { error: error.message, userId, options });
    throw error;
  }
};

const updateDataFlowPipeline = async (pipelineId, updates) => {
  try {
    // Construiește expression-ul de update dinamic
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      if (key === 'id' || key === 'userId') return; // Skip immutable fields
      
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key === 'startUrl' ? 'start_url' : 
                                           key === 'createdAt' ? 'created_at' :
                                           key === 'updatedAt' ? 'updated_at' :
                                           key === 'executionHistory' ? 'execution_history' : key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    if (updateExpressions.length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    const params = {
      TableName: DATAFLOW_PIPELINES_TABLE,
      Key: {
        pipeline_id: pipelineId
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    logger.info('Data flow pipeline updated successfully', { pipelineId });

    return { success: true, data: result.Attributes };
  } catch (error) {
    logger.error('Failed to update data flow pipeline', { error: error.message, pipelineId, updates });
    throw error;
  }
};

const deleteDataFlowPipeline = async (pipelineId, userId) => {
  try {
    const params = {
      TableName: DATAFLOW_PIPELINES_TABLE,
      Key: {
        pipeline_id: pipelineId,
        user_id: userId
      }
    };

    await dynamodb.delete(params).promise();
    logger.info('Data flow pipeline deleted successfully', { pipelineId, userId });

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete data flow pipeline', { error: error.message, pipelineId, userId });
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

  // Data Flow Pipelines operations
  saveDataFlowPipeline,
  getDataFlowPipeline,
  getDataFlowPipelines,
  updateDataFlowPipeline,
  deleteDataFlowPipeline,
};
