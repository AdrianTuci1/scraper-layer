package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Set up logging
	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	logger.Info("Starting ScraperGo service")

	// Create job channel
	jobChannel := make(chan *models.TaskMessage, cfg.MaxConcurrentJobs)

	// Create SQS consumer
	consumer, err := NewSQSConsumer(cfg, jobChannel)
	if err != nil {
		logger.WithError(err).Fatal("Failed to create SQS consumer")
	}

	// Create job processor
	processor, err := NewJobProcessor(cfg, jobChannel)
	if err != nil {
		logger.WithError(err).Fatal("Failed to create job processor")
	}

	// Create reporter for health checks
	reporter, err := NewReporter(cfg)
	if err != nil {
		logger.WithError(err).Fatal("Failed to create reporter")
	}

	// Create health checker
	healthChecker := NewHealthChecker(cfg, reporter)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start job processor
	go func() {
		if err := processor.Start(); err != nil {
			logger.WithError(err).Error("Job processor stopped with error")
		}
	}()

	// Start SQS consumer
	go func() {
		if err := consumer.Start(ctx); err != nil {
			logger.WithError(err).Error("SQS consumer stopped with error")
		}
	}()

	// Start health check server
	go func() {
		if err := healthChecker.StartHealthServer(); err != nil {
			logger.WithError(err).Error("Health check server stopped with error")
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("ScraperGo service started successfully")
	logger.WithFields(logrus.Fields{
		"worker_pool_size":    cfg.WorkerPoolSize,
		"max_concurrent_jobs": cfg.MaxConcurrentJobs,
		"sqs_queue_url":       cfg.SQSQueueURL,
		"s3_bucket":           cfg.S3BucketName,
	}).Info("Service configuration")

	// Wait for shutdown signal
	<-sigChan
	logger.Info("Shutdown signal received, stopping service...")

	// Cancel context to stop SQS consumer
	cancel()

	// Stop job processor
	processor.Stop()

	// Stop health check server
	healthCtx, healthCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer healthCancel()
	healthChecker.StopHealthServer(healthCtx)

	// Wait a bit for graceful shutdown
	time.Sleep(2 * time.Second)

	logger.Info("ScraperGo service stopped")
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
