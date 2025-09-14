package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

// SQSConsumer handles consuming messages from SQS
type SQSConsumer struct {
	config     *config.Config
	sqsClient  *sqs.SQS
	queueURL   string
	jobChannel chan *models.TaskMessage
	logger     *logrus.Logger
}

// NewSQSConsumer creates a new SQS consumer
func NewSQSConsumer(cfg *config.Config, jobChannel chan *models.TaskMessage) (*SQSConsumer, error) {
	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(cfg.AWSRegion),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	// Create SQS client
	sqsClient := sqs.New(sess)

	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	return &SQSConsumer{
		config:     cfg,
		sqsClient:  sqsClient,
		queueURL:   cfg.SQSQueueURL,
		jobChannel: jobChannel,
		logger:     logger,
	}, nil
}

// Start begins consuming messages from SQS
func (c *SQSConsumer) Start(ctx context.Context) error {
	c.logger.Info("Starting SQS consumer")

	for {
		select {
		case <-ctx.Done():
			c.logger.Info("SQS consumer stopped")
			return ctx.Err()
		default:
			if err := c.pollMessages(ctx); err != nil {
				c.logger.WithError(err).Error("Error polling messages from SQS")
				time.Sleep(5 * time.Second) // Wait before retrying
				continue
			}
		}
	}
}

// pollMessages polls for messages from SQS
func (c *SQSConsumer) pollMessages(ctx context.Context) error {
	// Use long polling for efficiency
	input := &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(c.queueURL),
		MaxNumberOfMessages: aws.Int64(10), // Process up to 10 messages at once
		WaitTimeSeconds:     aws.Int64(20), // Long polling for 20 seconds
		VisibilityTimeoutSeconds: aws.Int64(300), // 5 minutes visibility timeout
		MessageAttributeNames: []*string{
			aws.String("All"),
		},
	}

	result, err := c.sqsClient.ReceiveMessageWithContext(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to receive messages: %w", err)
	}

	if len(result.Messages) == 0 {
		c.logger.Debug("No messages received from SQS")
		return nil
	}

	c.logger.WithField("count", len(result.Messages)).Info("Received messages from SQS")

	// Process each message
	for _, message := range result.Messages {
		if err := c.processMessage(message); err != nil {
			c.logger.WithError(err).WithField("message_id", *message.MessageId).Error("Failed to process message")
			// Continue processing other messages even if one fails
			continue
		}

		// Delete the message from the queue after successful processing
		if err := c.deleteMessage(message); err != nil {
			c.logger.WithError(err).WithField("message_id", *message.MessageId).Error("Failed to delete message")
		}
	}

	return nil
}

// processMessage processes a single SQS message
func (c *SQSConsumer) processMessage(message *sqs.Message) error {
	c.logger.WithField("message_id", *message.MessageId).Debug("Processing message")

	// Parse the message body
	taskMessage, err := models.ParseTaskMessage(*message.Body)
	if err != nil {
		return fmt.Errorf("failed to parse task message: %w", err)
	}

	// Validate the task message
	if taskMessage.TaskID == "" {
		return fmt.Errorf("task_id is required")
	}
	if taskMessage.URL == "" {
		return fmt.Errorf("url is required")
	}

	c.logger.WithFields(logrus.Fields{
		"task_id": taskMessage.TaskID,
		"url":     taskMessage.URL,
	}).Info("Parsed task message successfully")

	// Send the task to the job channel
	select {
	case c.jobChannel <- taskMessage:
		c.logger.WithField("task_id", taskMessage.TaskID).Debug("Task sent to job channel")
	default:
		return fmt.Errorf("job channel is full, cannot process task %s", taskMessage.TaskID)
	}

	return nil
}

// deleteMessage deletes a message from the SQS queue
func (c *SQSConsumer) deleteMessage(message *sqs.Message) error {
	input := &sqs.DeleteMessageInput{
		QueueUrl:      aws.String(c.queueURL),
		ReceiptHandle: message.ReceiptHandle,
	}

	_, err := c.sqsClient.DeleteMessage(input)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}

	c.logger.WithField("message_id", *message.MessageId).Debug("Message deleted from SQS")
	return nil
}

// getLogLevel converts string log level to logrus level
func getLogLevel(level string) logrus.Level {
	switch level {
	case "debug":
		return logrus.DebugLevel
	case "info":
		return logrus.InfoLevel
	case "warn":
		return logrus.WarnLevel
	case "error":
		return logrus.ErrorLevel
	case "fatal":
		return logrus.FatalLevel
	case "panic":
		return logrus.PanicLevel
	default:
		return logrus.InfoLevel
	}
}
