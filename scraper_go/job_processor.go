package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

// JobProcessor manages the pool of goroutines for processing scraping jobs
type JobProcessor struct {
	config        *config.Config
	jobChannel    chan *models.TaskMessage
	workerPool    chan struct{}
	scraperEngine *ScraperEngine
	s3Uploader    *S3Uploader
	reporter      *Reporter
	logger        *logrus.Logger
	wg            sync.WaitGroup
	ctx           context.Context
	cancel        context.CancelFunc
}

// NewJobProcessor creates a new job processor
func NewJobProcessor(cfg *config.Config, jobChannel chan *models.TaskMessage) (*JobProcessor, error) {
	ctx, cancel := context.WithCancel(context.Background())

	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	// Create scraper engine
	scraperEngine, err := NewScraperEngine(cfg)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create scraper engine: %w", err)
	}

	// Create S3 uploader
	s3Uploader, err := NewS3Uploader(cfg)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create S3 uploader: %w", err)
	}

	// Create reporter
	reporter, err := NewReporter(cfg)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to create reporter: %w", err)
	}

	// Create worker pool channel
	workerPool := make(chan struct{}, cfg.WorkerPoolSize)

	return &JobProcessor{
		config:        cfg,
		jobChannel:    jobChannel,
		workerPool:    workerPool,
		scraperEngine: scraperEngine,
		s3Uploader:    s3Uploader,
		reporter:      reporter,
		logger:        logger,
		ctx:           ctx,
		cancel:        cancel,
	}, nil
}

// Start begins processing jobs from the job channel
func (jp *JobProcessor) Start() error {
	jp.logger.WithField("pool_size", jp.config.WorkerPoolSize).Info("Starting job processor")

	// Start workers
	for i := 0; i < jp.config.WorkerPoolSize; i++ {
		jp.wg.Add(1)
		go jp.worker(i)
	}

	// Wait for all workers to finish
	jp.wg.Wait()
	jp.logger.Info("Job processor stopped")
	return nil
}

// Stop stops the job processor
func (jp *JobProcessor) Stop() {
	jp.logger.Info("Stopping job processor")
	jp.cancel()
	jp.wg.Wait()
}

// worker is a single worker goroutine that processes jobs
func (jp *JobProcessor) worker(workerID int) {
	defer jp.wg.Done()

	jp.logger.WithField("worker_id", workerID).Debug("Worker started")

	for {
		select {
		case <-jp.ctx.Done():
			jp.logger.WithField("worker_id", workerID).Debug("Worker stopped")
			return
		case job := <-jp.jobChannel:
			// Acquire a slot in the worker pool
			select {
			case jp.workerPool <- struct{}{}:
				// Process the job
				jp.processJob(workerID, job)
				// Release the slot
				<-jp.workerPool
			case <-jp.ctx.Done():
				jp.logger.WithField("worker_id", workerID).Debug("Worker stopped")
				return
			}
		}
	}
}

// processJob processes a single scraping job
func (jp *JobProcessor) processJob(workerID int, job *models.TaskMessage) {
	startTime := time.Now()
	
	jp.logger.WithFields(logrus.Fields{
		"worker_id": workerID,
		"task_id":   job.TaskID,
		"url":       job.URL,
	}).Info("Processing job")

	// Create a result object
	result := &models.ScrapingResult{
		TaskID:    job.TaskID,
		URL:       job.URL,
		Status:    models.TaskStatusInProgress,
		Timestamp: time.Now(),
	}

	// Send initial status update
	statusUpdate := &models.StatusUpdate{
		TaskID:    job.TaskID,
		Status:    models.TaskStatusInProgress,
		Timestamp: time.Now(),
	}
	
	if err := jp.reporter.ReportStatus(statusUpdate); err != nil {
		jp.logger.WithError(err).WithField("task_id", job.TaskID).Warn("Failed to send initial status update")
	}

	// Process the scraping job
	data, err := jp.scraperEngine.Scrape(job)
	if err != nil {
		jp.logger.WithError(err).WithFields(logrus.Fields{
			"worker_id": workerID,
			"task_id":   job.TaskID,
			"url":       job.URL,
		}).Error("Scraping failed")

		result.Status = models.TaskStatusFailed
		result.Error = err.Error()
		result.Duration = time.Since(startTime).Milliseconds()
		result.Cost = jp.calculateCost(job, false)

		// Report failure
		statusUpdate = &models.StatusUpdate{
			TaskID:    job.TaskID,
			Status:    models.TaskStatusFailed,
			Error:     err.Error(),
			Cost:      result.Cost,
			Duration:  result.Duration,
			Timestamp: time.Now(),
		}
	} else {
		// Scraping successful
		result.Data = data
		result.Status = models.TaskStatusCompleted
		result.Duration = time.Since(startTime).Milliseconds()
		result.Cost = jp.calculateCost(job, true)

		// Upload to S3 with specified format
		outputFormat := job.Options.OutputFormat
		if outputFormat == "" {
			outputFormat = jp.config.DefaultOutputFormat
		}
		
		s3Location, err := jp.s3Uploader.UploadResult(result, outputFormat)
		if err != nil {
			jp.logger.WithError(err).WithField("task_id", job.TaskID).Error("Failed to upload result to S3")
			result.Error = fmt.Sprintf("Failed to upload to S3: %v", err)
			result.Status = models.TaskStatusFailed
		} else {
			result.S3Location = s3Location
		}

		// Report success
		statusUpdate = &models.StatusUpdate{
			TaskID:     job.TaskID,
			Status:     result.Status,
			Cost:       result.Cost,
			Duration:   result.Duration,
			S3Location: result.S3Location,
			Timestamp:  time.Now(),
		}
	}

	// Send final status update
	if err := jp.reporter.ReportStatus(statusUpdate); err != nil {
		jp.logger.WithError(err).WithField("task_id", job.TaskID).Warn("Failed to send final status update")
	}

	jp.logger.WithFields(logrus.Fields{
		"worker_id": workerID,
		"task_id":   job.TaskID,
		"status":    result.Status,
		"duration":  result.Duration,
		"cost":      result.Cost,
	}).Info("Job completed")
}

// calculateCost calculates the cost of a scraping job
func (jp *JobProcessor) calculateCost(job *models.TaskMessage, success bool) float64 {
	baseCost := 0.01 // Base cost per job

	// Add cost for JavaScript rendering
	if job.Options.EnableJS {
		baseCost += 0.02
	}

	// Add cost for retries
	if job.Options.MaxRetries > 0 {
		baseCost += float64(job.Options.MaxRetries) * 0.005
	}

	// Add cost for proxy usage
	if job.Options.ProxyURL != "" {
		baseCost += 0.01
	}

	// If the job failed, still charge a minimal amount
	if !success {
		baseCost = baseCost * 0.5
	}

	return baseCost
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
