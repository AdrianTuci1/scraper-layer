package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

// Reporter handles sending status updates to the Node.js API
type Reporter struct {
	config    *config.Config
	httpClient *http.Client
	apiURL    string
	apiKey    string
	logger    *logrus.Logger
}

// NewReporter creates a new reporter
func NewReporter(cfg *config.Config) (*Reporter, error) {
	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	// Create HTTP client with timeout
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	return &Reporter{
		config:     cfg,
		httpClient: httpClient,
		apiURL:     cfg.NodeAPIURL,
		apiKey:     cfg.APIKey,
		logger:     logger,
	}, nil
}

// ReportStatus sends a status update to the Node.js API
func (r *Reporter) ReportStatus(statusUpdate *models.StatusUpdate) error {
	r.logger.WithFields(logrus.Fields{
		"task_id": statusUpdate.TaskID,
		"status":  statusUpdate.Status,
	}).Debug("Reporting status update")

	// Convert status update to JSON
	jsonData, err := statusUpdate.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to marshal status update: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(
		context.Background(),
		"POST",
		fmt.Sprintf("%s/callback", r.apiURL),
		bytes.NewBufferString(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.apiKey))
	req.Header.Set("User-Agent", "ScraperGo/1.0")

	// Send request
	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send status update: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("status update failed with status: %d", resp.StatusCode)
	}

	r.logger.WithFields(logrus.Fields{
		"task_id": statusUpdate.TaskID,
		"status":  statusUpdate.Status,
		"code":    resp.StatusCode,
	}).Info("Status update sent successfully")

	return nil
}

// ReportError sends an error report to the Node.js API
func (r *Reporter) ReportError(taskID string, err error) error {
	statusUpdate := &models.StatusUpdate{
		TaskID:    taskID,
		Status:    models.TaskStatusFailed,
		Error:     err.Error(),
		Timestamp: time.Now(),
	}

	return r.ReportStatus(statusUpdate)
}

// ReportCompletion sends a completion report to the Node.js API
func (r *Reporter) ReportCompletion(taskID, s3Location string, cost float64, duration int64) error {
	statusUpdate := &models.StatusUpdate{
		TaskID:     taskID,
		Status:     models.TaskStatusCompleted,
		S3Location: s3Location,
		Cost:       cost,
		Duration:   duration,
		Timestamp:  time.Now(),
	}

	return r.ReportStatus(statusUpdate)
}

// SendCallback sends a callback to the user's specified URL
func (r *Reporter) SendCallback(callbackURL string, result *models.ScrapingResult) error {
	if callbackURL == "" {
		r.logger.Debug("No callback URL specified, skipping callback")
		return nil
	}

	r.logger.WithFields(logrus.Fields{
		"task_id":      result.TaskID,
		"callback_url": callbackURL,
	}).Debug("Sending callback to user")

	// Convert result to JSON
	jsonData, err := result.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to marshal result for callback: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(
		context.Background(),
		"POST",
		callbackURL,
		bytes.NewBufferString(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to create callback request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "ScraperGo/1.0")

	// Send request
	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send callback: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("callback failed with status: %d", resp.StatusCode)
	}

	r.logger.WithFields(logrus.Fields{
		"task_id":      result.TaskID,
		"callback_url": callbackURL,
		"code":         resp.StatusCode,
	}).Info("Callback sent successfully")

	return nil
}

// HealthCheck checks if the Node.js API is reachable
func (r *Reporter) HealthCheck() error {
	r.logger.Debug("Performing health check")

	req, err := http.NewRequestWithContext(
		context.Background(),
		"GET",
		fmt.Sprintf("%s/health", r.apiURL),
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.apiKey))
	req.Header.Set("User-Agent", "ScraperGo/1.0")

	// Send request
	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("health check failed with status: %d", resp.StatusCode)
	}

	r.logger.Info("Health check passed")
	return nil
}

// BatchReportStatus sends multiple status updates in a batch
func (r *Reporter) BatchReportStatus(statusUpdates []*models.StatusUpdate) error {
	if len(statusUpdates) == 0 {
		return nil
	}

	r.logger.WithField("count", len(statusUpdates)).Debug("Sending batch status updates")

	// Convert status updates to JSON
	jsonData, err := json.Marshal(statusUpdates)
	if err != nil {
		return fmt.Errorf("failed to marshal batch status updates: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(
		context.Background(),
		"POST",
		fmt.Sprintf("%s/callback/batch", r.apiURL),
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to create batch request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.apiKey))
	req.Header.Set("User-Agent", "ScraperGo/1.0")

	// Send request
	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send batch status updates: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("batch status update failed with status: %d", resp.StatusCode)
	}

	r.logger.WithField("count", len(statusUpdates)).Info("Batch status updates sent successfully")
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
