package models

import (
	"encoding/json"
	"time"
)

// TaskStatus represents the status of a scraping task
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusFailed     TaskStatus = "failed"
)

// TaskMessage represents a message from SQS containing task details
type TaskMessage struct {
	TaskID      string                 `json:"task_id"`
	URL         string                 `json:"url"`
	Schema      map[string]interface{} `json:"schema"`
	Options     ScrapingOptions        `json:"options"`
	CallbackURL string                 `json:"callback_url,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
}

// ScrapingOptions contains configuration options for scraping
type ScrapingOptions struct {
	UserAgent      string            `json:"user_agent,omitempty"`
	Timeout        int               `json:"timeout,omitempty"` // in seconds
	EnableJS       bool              `json:"enable_js,omitempty"`
	WaitForElement string            `json:"wait_for_element,omitempty"`
	Headers        map[string]string `json:"headers,omitempty"`
	ProxyURL       string            `json:"proxy_url,omitempty"`
	MaxRetries     int               `json:"max_retries,omitempty"`
	RetryDelay     int               `json:"retry_delay,omitempty"` // in seconds
	RespectRobots  bool              `json:"respect_robots,omitempty"`
}

// ScrapingResult represents the result of a scraping operation
type ScrapingResult struct {
	TaskID      string                 `json:"task_id"`
	URL         string                 `json:"url"`
	Data        map[string]interface{} `json:"data"`
	Status      TaskStatus             `json:"status"`
	Error       string                 `json:"error,omitempty"`
	Cost        float64                `json:"cost"`
	Duration    int64                  `json:"duration"` // in milliseconds
	Timestamp   time.Time              `json:"timestamp"`
	S3Location  string                 `json:"s3_location,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// StatusUpdate represents a status update to be sent to the Node.js API
type StatusUpdate struct {
	TaskID     string     `json:"task_id"`
	Status     TaskStatus `json:"status"`
	Error      string     `json:"error,omitempty"`
	Cost       float64    `json:"cost,omitempty"`
	Duration   int64      `json:"duration,omitempty"`
	S3Location string     `json:"s3_location,omitempty"`
	Timestamp  time.Time  `json:"timestamp"`
}

// ProxyInfo represents proxy configuration
type ProxyInfo struct {
	URL      string `json:"url"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

// ParseTaskMessage parses a JSON string into a TaskMessage
func ParseTaskMessage(jsonData string) (*TaskMessage, error) {
	var task TaskMessage
	err := json.Unmarshal([]byte(jsonData), &task)
	if err != nil {
		return nil, err
	}
	return &task, nil
}

// ToJSON converts a TaskMessage to JSON string
func (tm *TaskMessage) ToJSON() (string, error) {
	data, err := json.Marshal(tm)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToJSON converts a ScrapingResult to JSON string
func (sr *ScrapingResult) ToJSON() (string, error) {
	data, err := json.Marshal(sr)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToJSON converts a StatusUpdate to JSON string
func (su *StatusUpdate) ToJSON() (string, error) {
	data, err := json.Marshal(su)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
