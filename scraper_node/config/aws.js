const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.REGION || 'us-east-1',
});

// Create AWS service instances
const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

const sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
});

const events = new AWS.EventBridge({
  apiVersion: '2015-10-07',
});

module.exports = {
  dynamodb,
  sqs,
  s3,
  events,
  AWS,
};
