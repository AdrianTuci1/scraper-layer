const express = require('express');
const logger = require('../config/logger');
const { getJob } = require('../services/dynamodb');
const { generatePresignedDownloadUrl, getObjectMetadata } = require('../services/s3');
const {
  success,
  error,
  validationError,
  notFound,
  internalError,
} = require('../utils/response');

const router = express.Router();

// Generate presigned download URL for job results
router.get('/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userContext.userId;
    const { redirect = 'false' } = req.query;
    
    if (!jobId) {
      return res.status(400).json(validationError(['Job ID is required']));
    }
    
    logger.info('Generating download URL', { jobId, userId });
    
    // Get job details to verify ownership and status
    const jobResult = await getJob(jobId);
    
    if (!jobResult.success) {
      return res.status(404).json(notFound('Job'));
    }
    
    const job = jobResult.data;
    
    // Check if user owns this job
    if (job.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Check if job is completed
    if (job.status !== 'completed') {
      return res.status(400).json(error(
        `Job is not completed yet. Current status: ${job.status}`, 
        400
      ));
    }
    
    // Check if job has results in S3
    if (!job.s3_location) {
      return res.status(404).json(error(
        'No results available for download. Job may have completed without generating results.',
        404
      ));
    }
    
    try {
      // Verify the S3 object exists and get metadata
      const metadataResult = await getObjectMetadata(job.s3_location);
      
      if (!metadataResult.success) {
        return res.status(404).json(error(
          'Result file not found in storage',
          404
        ));
      }
      
      // Generate presigned download URL (valid for 1 hour)
      const urlResult = await generatePresignedDownloadUrl(job.s3_location, 3600);
      
      if (!urlResult.success) {
        return res.status(500).json(internalError('Failed to generate download URL'));
      }
      
      logger.info('Download URL generated successfully', {
        jobId,
        userId,
        fileSize: metadataResult.metadata.contentLength,
        contentType: metadataResult.metadata.contentType,
      });
      
      // If redirect is requested, redirect directly to S3
      if (redirect === 'true') {
        return res.redirect(302, urlResult.url);
      }
      
      // Return download information
      const response = success({
        downloadUrl: urlResult.url,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        fileInfo: {
          size: metadataResult.metadata.contentLength,
          contentType: metadataResult.metadata.contentType,
          lastModified: metadataResult.metadata.lastModified,
        },
        jobInfo: {
          jobId: job.job_id,
          url: job.url,
          completedAt: job.updated_at,
        },
      });
      
      return res.status(200).json(response);
      
    } catch (s3Error) {
      logger.error('S3 operation failed', {
        jobId,
        s3Location: job.s3_location,
        error: s3Error.message,
      });
      
      return res.status(500).json(internalError('Failed to access result file'));
    }
    
  } catch (error) {
    logger.error('Failed to generate download URL', { 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(internalError('Failed to generate download URL'));
  }
});

// Direct download redirect (alternative endpoint that redirects browser to S3)
router.get('/:jobId/download/redirect', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userContext.userId;
    
    if (!jobId) {
      return res.status(400).json(validationError(['Job ID is required']));
    }
    
    logger.info('Processing redirect download', { jobId, userId });
    
    // Get job details to verify ownership and status
    const jobResult = await getJob(jobId);
    
    if (!jobResult.success) {
      return res.status(404).json(notFound('Job'));
    }
    
    const job = jobResult.data;
    
    // Check if user owns this job
    if (job.user_id !== userId) {
      return res.status(403).json(error('Access denied', 403));
    }
    
    // Check if job is completed
    if (job.status !== 'completed') {
      return res.status(400).json(error(
        `Job is not completed yet. Current status: ${job.status}`, 
        400
      ));
    }
    
    // Check if job has results in S3
    if (!job.s3_location) {
      return res.status(404).json(error(
        'No results available for download',
        404
      ));
    }
    
    try {
      // Generate presigned download URL (valid for 1 hour)
      const urlResult = await generatePresignedDownloadUrl(job.s3_location, 3600);
      
      if (!urlResult.success) {
        return res.status(500).json(internalError('Failed to generate download URL'));
      }
      
      logger.info('Redirect download URL generated', {
        jobId,
        userId,
      });
      
      // Return redirect response
      return res.redirect(302, urlResult.url);
      
    } catch (s3Error) {
      logger.error('S3 operation failed for redirect', {
        jobId,
        s3Location: job.s3_location,
        error: s3Error.message,
      });
      
      return res.status(500).json(internalError('Failed to access result file'));
    }
    
  } catch (error) {
    logger.error('Failed to process redirect download', { 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(internalError('Failed to process download redirect'));
  }
});

// List user's downloadable results
router.get('/downloads', async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const { limit = 50, status = 'completed' } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    
    logger.info('Listing downloadable results', { userId, limit: limitNum, status });
    
    // This would require additional DynamoDB query or S3 listing
    // For now, return a placeholder response
    const response = success({
      message: 'Download listing endpoint - to be implemented',
      userId,
      limit: limitNum,
      status,
      downloads: [],
    });
    
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to list downloads', { 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(internalError('Failed to list downloadable results'));
  }
});

module.exports = router;
