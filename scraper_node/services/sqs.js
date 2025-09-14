const { sqs } = require('../config/aws');
const logger = require('../config/logger');

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const sendScrapingJob = async (jobData) => {
  try {
    const messageBody = {
      jobId: jobData.jobId,
      userId: jobData.userId,
      url: jobData.url,
      options: jobData.options || {},
      callbackUrl: jobData.callbackUrl,
      timestamp: new Date().toISOString(),
    };
    
    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
      MessageAttributes: {
        jobId: {
          DataType: 'String',
          StringValue: jobData.jobId,
        },
        userId: {
          DataType: 'String',
          StringValue: jobData.userId,
        },
        priority: {
          DataType: 'String',
          StringValue: jobData.priority || 'normal',
        },
      },
      // Delay for immediate processing (0 seconds)
      DelaySeconds: 0,
    };
    
    const result = await sqs.sendMessage(params).promise();
    
    logger.info('Scraping job sent to SQS', {
      jobId: jobData.jobId,
      messageId: result.MessageId,
    });
    
    return {
      success: true,
      messageId: result.MessageId,
      data: messageBody,
    };
  } catch (error) {
    logger.error('Failed to send scraping job to SQS', {
      error: error.message,
      jobData,
    });
    throw error;
  }
};

const sendBulkScrapingJobs = async (jobsData) => {
  try {
    const entries = jobsData.map((jobData, index) => ({
      Id: `job-${index}-${Date.now()}`,
      MessageBody: JSON.stringify({
        jobId: jobData.jobId,
        userId: jobData.userId,
        url: jobData.url,
        options: jobData.options || {},
        callbackUrl: jobData.callbackUrl,
        timestamp: new Date().toISOString(),
      }),
      MessageAttributes: {
        jobId: {
          DataType: 'String',
          StringValue: jobData.jobId,
        },
        userId: {
          DataType: 'String',
          StringValue: jobData.userId,
        },
        priority: {
          DataType: 'String',
          StringValue: jobData.priority || 'normal',
        },
        bulkJob: {
          DataType: 'String',
          StringValue: 'true',
        },
      },
    }));
    
    // SQS batch send allows up to 10 messages per batch
    const batches = [];
    for (let i = 0; i < entries.length; i += 10) {
      batches.push(entries.slice(i, i + 10));
    }
    
    const results = [];
    for (const batch of batches) {
      const params = {
        QueueUrl: QUEUE_URL,
        Entries: batch,
      };
      
      const result = await sqs.sendMessageBatch(params).promise();
      results.push(result);
      
      logger.info('Bulk scraping jobs sent to SQS', {
        batchSize: batch.length,
        successful: result.Successful?.length || 0,
        failed: result.Failed?.length || 0,
      });
    }
    
    return {
      success: true,
      results,
      totalJobs: jobsData.length,
    };
  } catch (error) {
    logger.error('Failed to send bulk scraping jobs to SQS', {
      error: error.message,
      jobsCount: jobsData.length,
    });
    throw error;
  }
};

const getQueueAttributes = async () => {
  try {
    const params = {
      QueueUrl: QUEUE_URL,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed',
      ],
    };
    
    const result = await sqs.getQueueAttributes(params).promise();
    
    return {
      success: true,
      attributes: result.Attributes,
    };
  } catch (error) {
    logger.error('Failed to get queue attributes', { error: error.message });
    throw error;
  }
};

const purgeQueue = async () => {
  try {
    const params = {
      QueueUrl: QUEUE_URL,
    };
    
    await sqs.purgeQueue(params).promise();
    
    logger.info('Queue purged successfully');
    
    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to purge queue', { error: error.message });
    throw error;
  }
};

module.exports = {
  sendScrapingJob,
  sendBulkScrapingJobs,
  getQueueAttributes,
  purgeQueue,
};
