package main

import (
	"bytes"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

// S3Uploader handles uploading scraping results to S3
type S3Uploader struct {
	config    *config.Config
	s3Client  *s3.S3
	bucketName string
	logger    *logrus.Logger
}

// NewS3Uploader creates a new S3 uploader
func NewS3Uploader(cfg *config.Config) (*S3Uploader, error) {
	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(cfg.AWSRegion),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	// Create S3 client
	s3Client := s3.New(sess)

	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	return &S3Uploader{
		config:     cfg,
		s3Client:   s3Client,
		bucketName: cfg.S3BucketName,
		logger:     logger,
	}, nil
}

// UploadResult uploads a scraping result to S3
func (u *S3Uploader) UploadResult(result *models.ScrapingResult) (string, error) {
	u.logger.WithField("task_id", result.TaskID).Debug("Uploading result to S3")

	// Convert result to JSON
	jsonData, err := result.ToJSON()
	if err != nil {
		return "", fmt.Errorf("failed to marshal result to JSON: %w", err)
	}

	// Create S3 key
	key := fmt.Sprintf("results/%s/%s.json", 
		time.Now().Format("2006/01/02"), 
		result.TaskID)

	// Upload to S3
	_, err = u.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(u.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader([]byte(jsonData)),
		ContentType: aws.String("application/json"),
		Metadata: map[string]*string{
			"task_id":    aws.String(result.TaskID),
			"url":        aws.String(result.URL),
			"status":     aws.String(string(result.Status)),
			"created_at": aws.String(result.Timestamp.Format(time.RFC3339)),
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload to S3: %w", err)
	}

	// Generate S3 URL
	s3URL := fmt.Sprintf("s3://%s/%s", u.bucketName, key)

	u.logger.WithFields(logrus.Fields{
		"task_id": result.TaskID,
		"s3_url":  s3URL,
	}).Info("Result uploaded to S3 successfully")

	return s3URL, nil
}

// UploadRawData uploads raw data to S3 (for debugging or special cases)
func (u *S3Uploader) UploadRawData(taskID, contentType string, data []byte) (string, error) {
	u.logger.WithField("task_id", taskID).Debug("Uploading raw data to S3")

	// Create S3 key
	key := fmt.Sprintf("raw/%s/%s", 
		time.Now().Format("2006/01/02"), 
		taskID)

	// Upload to S3
	_, err := u.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(u.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
		Metadata: map[string]*string{
			"task_id":    aws.String(taskID),
			"created_at": aws.String(time.Now().Format(time.RFC3339)),
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload raw data to S3: %w", err)
	}

	// Generate S3 URL
	s3URL := fmt.Sprintf("s3://%s/%s", u.bucketName, key)

	u.logger.WithFields(logrus.Fields{
		"task_id": taskID,
		"s3_url":  s3URL,
	}).Info("Raw data uploaded to S3 successfully")

	return s3URL, nil
}

// GetSignedURL generates a signed URL for accessing the result
func (u *S3Uploader) GetSignedURL(s3Key string, expiration time.Duration) (string, error) {
	req, _ := u.s3Client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(u.bucketName),
		Key:    aws.String(s3Key),
	})

	url, err := req.Presign(expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return url, nil
}

// DeleteResult deletes a result from S3
func (u *S3Uploader) DeleteResult(s3Key string) error {
	u.logger.WithField("s3_key", s3Key).Debug("Deleting result from S3")

	_, err := u.s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(u.bucketName),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete from S3: %w", err)
	}

	u.logger.WithField("s3_key", s3Key).Info("Result deleted from S3 successfully")
	return nil
}

// ListResults lists results for a specific date range
func (u *S3Uploader) ListResults(prefix string, maxKeys int64) ([]*s3.Object, error) {
	u.logger.WithField("prefix", prefix).Debug("Listing results from S3")

	input := &s3.ListObjectsV2Input{
		Bucket:  aws.String(u.bucketName),
		Prefix:  aws.String(prefix),
		MaxKeys: aws.Int64(maxKeys),
	}

	result, err := u.s3Client.ListObjectsV2(input)
	if err != nil {
		return nil, fmt.Errorf("failed to list objects from S3: %w", err)
	}

	u.logger.WithField("count", len(result.Contents)).Info("Listed results from S3")
	return result.Contents, nil
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
