const { s3 } = require('../config/aws');
const logger = require('../config/logger');

const BUCKET_NAME = process.env.S3_BUCKET;

const generatePresignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn, // URL expires in 1 hour by default
      ResponseContentDisposition: 'attachment',
    };
    
    const url = await s3.getSignedUrlPromise('getObject', params);
    
    logger.info('Presigned download URL generated', { key, expiresIn });
    
    return {
      success: true,
      url,
      expiresIn,
    };
  } catch (error) {
    logger.error('Failed to generate presigned download URL', {
      error: error.message,
      key,
    });
    throw error;
  }
};

const uploadScrapingResult = async (key, data, contentType = 'application/json') => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      ContentType: contentType,
      Metadata: {
        'scraper-service': 'scraper-layer',
        'upload-timestamp': new Date().toISOString(),
      },
    };
    
    const result = await s3.upload(params).promise();
    
    logger.info('Scraping result uploaded to S3', {
      key,
      location: result.Location,
    });
    
    return {
      success: true,
      location: result.Location,
      key: result.Key,
      etag: result.ETag,
    };
  } catch (error) {
    logger.error('Failed to upload scraping result to S3', {
      error: error.message,
      key,
    });
    throw error;
  }
};

const deleteScrapingResult = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };
    
    await s3.deleteObject(params).promise();
    
    logger.info('Scraping result deleted from S3', { key });
    
    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to delete scraping result from S3', {
      error: error.message,
      key,
    });
    throw error;
  }
};

const getObjectMetadata = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };
    
    const result = await s3.headObject(params).promise();
    
    return {
      success: true,
      metadata: {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      },
    };
  } catch (error) {
    if (error.code === 'NotFound') {
      return {
        success: false,
        error: 'Object not found',
      };
    }
    
    logger.error('Failed to get object metadata from S3', {
      error: error.message,
      key,
    });
    throw error;
  }
};

const listUserResults = async (userId, prefix = '', maxKeys = 1000) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix || `user-${userId}/`,
      MaxKeys: maxKeys,
    };
    
    const result = await s3.listObjectsV2(params).promise();
    
    const objects = result.Contents?.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag,
    })) || [];
    
    return {
      success: true,
      objects,
      count: objects.length,
      isTruncated: result.IsTruncated,
      nextContinuationToken: result.NextContinuationToken,
    };
  } catch (error) {
    logger.error('Failed to list user results from S3', {
      error: error.message,
      userId,
      prefix,
    });
    throw error;
  }
};

const generateS3Key = (userId, jobId, extension = 'json') => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `user-${userId}/jobs/${timestamp}/${jobId}.${extension}`;
};

module.exports = {
  generatePresignedDownloadUrl,
  uploadScrapingResult,
  deleteScrapingResult,
  getObjectMetadata,
  listUserResults,
  generateS3Key,
};
