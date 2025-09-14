const express = require('express');
const logger = require('../config/logger');
const { validate, callbackSchema } = require('../services/validator');
const { getJob, updateJobStatus } = require('../services/dynamodb');
const {
  success,
  error,
  validationError,
  notFound,
  internalError,
} = require('../utils/response');

const router = express.Router();

// Update job status from Golang worker callback
router.post('/:jobId/callback', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json(validationError(['Job ID is required']));
    }
    
    logger.info('Receiving job callback', { jobId });
    
    // Validate callback data
    const validation = validate(callbackSchema, req.body);
    if (!validation.isValid) {
      return res.status(400).json(validationError(validation.errors));
    }
    
    const { status, result = {} } = validation.data;
    
    // Get existing job to verify it exists and get user info
    const jobResult = await getJob(jobId);
    
    if (!jobResult.success) {
      return res.status(404).json(notFound('Job'));
    }
    
    const job = jobResult.data;
    
    // Prepare additional data for update
    const additionalData = {};
    
    if (status === 'completed' && result.s3Location) {
      additionalData.s3Location = result.s3Location;
    } else if (status === 'failed' && result.error) {
      additionalData.errorMessage = result.error;
    }
    
    // Update job status in DynamoDB
    await updateJobStatus(jobId, status, additionalData);
    
    logger.info('Job status updated successfully', {
      jobId,
      status,
      userId: job.user_id,
    });
    
    // If job has a callback URL, notify the client
    if (job.callback_url && status !== 'running') {
      try {
        await notifyClient(job.callback_url, {
          jobId,
          status,
          result: status === 'completed' ? {
            s3Location: result.s3Location,
            data: result.data,
          } : {
            error: result.error,
          },
          timestamp: new Date().toISOString(),
        });
        
        logger.info('Client notified successfully', { 
          jobId, 
          callbackUrl: job.callback_url 
        });
      } catch (notifyError) {
        // Log error but don't fail the callback
        logger.error('Failed to notify client', {
          jobId,
          callbackUrl: job.callback_url,
          error: notifyError.message,
        });
      }
    }
    
    // Return success response
    const response = success({
      message: 'Job status updated successfully',
      jobId,
      status,
      timestamp: new Date().toISOString(),
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to process job callback', { 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(internalError('Failed to process job callback'));
  }
});

// Health check endpoint for callbacks
router.get('/health', async (req, res) => {
  try {
    const response = success({
      message: 'Callback service is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return res.status(500).json(internalError('Health check failed'));
  }
});

// Notify client via HTTP callback
const notifyClient = async (callbackUrl, data) => {
  const https = require('https');
  const http = require('http');
  const url = require('url');
  
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new url.URL(callbackUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'ScraperLayer-Callback/1.0',
        },
        timeout: 10000, // 10 second timeout
      };
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: res.statusCode,
              data: responseData,
            });
          } else {
            reject(new Error(`Callback failed with status ${res.statusCode}: ${responseData}`));
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Callback request timeout'));
      });
      
      req.write(postData);
      req.end();
      
    } catch (parseError) {
      reject(new Error(`Invalid callback URL: ${parseError.message}`));
    }
  });
};

module.exports = router;
