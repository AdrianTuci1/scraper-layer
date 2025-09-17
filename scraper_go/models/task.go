package models

import (
	"encoding/json"
	"fmt"
	"strings"
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
	
	// Output format options
	OutputFormat   string            `json:"output_format,omitempty"` // json, html, xml, md, csv
	Template       string            `json:"template,omitempty"`      // template custom pentru output
	
	// Anti-bot și CAPTCHA options
	StealthMode        bool              `json:"stealth_mode,omitempty"`
	CaptchaSolver      string            `json:"captcha_solver,omitempty"`      // "2captcha", "anticaptcha", "manual"
	CaptchaApiKey      string            `json:"captcha_api_key,omitempty"`
	RandomDelay        bool              `json:"random_delay,omitempty"`
	MinDelay           int               `json:"min_delay,omitempty"`           // in seconds
	MaxDelay           int               `json:"max_delay,omitempty"`           // in seconds
	HumanBehavior      bool              `json:"human_behavior,omitempty"`
	ViewportWidth      int               `json:"viewport_width,omitempty"`
	ViewportHeight     int               `json:"viewport_height,omitempty"`
	DisableImages      bool              `json:"disable_images,omitempty"`
	DisableCSS         bool              `json:"disable_css,omitempty"`
	DisableJS          bool              `json:"disable_js,omitempty"`
	WebGLFingerprint   bool              `json:"webgl_fingerprint,omitempty"`
	CanvasFingerprint  bool              `json:"canvas_fingerprint,omitempty"`
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

// ToHTML converts a ScrapingResult to HTML string
func (sr *ScrapingResult) ToHTML() (string, error) {
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <title>Scraping Result - %s</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
        .data { margin: 20px 0; }
        .field { margin: 10px 0; padding: 10px; border-left: 3px solid #007acc; }
        .field-name { font-weight: bold; color: #007acc; }
        .field-value { margin-top: 5px; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Scraping Result</h1>
        <p><strong>Task ID:</strong> %s</p>
        <p><strong>URL:</strong> <a href="%s" target="_blank">%s</a></p>
        <p><strong>Status:</strong> <span class="%s">%s</span></p>
        <p><strong>Timestamp:</strong> %s</p>
        <p><strong>Duration:</strong> %dms</p>
        <p><strong>Cost:</strong> $%.2f</p>`, 
		sr.TaskID, sr.TaskID, sr.URL, sr.URL, 
		func() string { if sr.Status == TaskStatusCompleted { return "success" } else { return "error" } }(), 
		sr.Status, sr.Timestamp.Format("2006-01-02 15:04:05"), sr.Duration, sr.Cost)

	if sr.Error != "" {
		html += fmt.Sprintf(`<p><strong>Error:</strong> <span class="error">%s</span></p>`, sr.Error)
	}

	html += `
    </div>
    <div class="data">
        <h2>Extracted Data</h2>`

	for key, value := range sr.Data {
		html += fmt.Sprintf(`
        <div class="field">
            <div class="field-name">%s:</div>
            <div class="field-value">%v</div>
        </div>`, key, value)
	}

	html += `
    </div>
</body>
</html>`
	
	return html, nil
}

// ToMarkdown converts a ScrapingResult to Markdown string
func (sr *ScrapingResult) ToMarkdown() (string, error) {
	md := fmt.Sprintf(`# Scraping Result

## Metadata
- **Task ID:** %s
- **URL:** [%s](%s)
- **Status:** %s
- **Timestamp:** %s
- **Duration:** %dms
- **Cost:** $%.2f

`, sr.TaskID, sr.URL, sr.URL, sr.Status, sr.Timestamp.Format("2006-01-02 15:04:05"), 
   sr.Duration, sr.Cost)

	if sr.Error != "" {
		md += fmt.Sprintf("- **Error:** %s\n\n", sr.Error)
	}

	md += "## Extracted Data\n\n"

	for key, value := range sr.Data {
		md += fmt.Sprintf("### %s\n\n%s\n\n", key, value)
	}

	return md, nil
}

// ToXML converts a ScrapingResult to XML string
func (sr *ScrapingResult) ToXML() (string, error) {
	xml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<scrapingResult>
    <metadata>
        <taskId>%s</taskId>
        <url>%s</url>
        <status>%s</status>
        <timestamp>%s</timestamp>
        <duration>%d</duration>
        <cost>%.2f</cost>`, 
    sr.TaskID, sr.URL, sr.Status, sr.Timestamp.Format(time.RFC3339), 
    sr.Duration, sr.Cost)

	if sr.Error != "" {
		xml += fmt.Sprintf("\n        <error><![CDATA[%s]]></error>", sr.Error)
	}

	xml += `
    </metadata>
    <data>`

	for key, value := range sr.Data {
		xml += fmt.Sprintf("\n        <%s><![CDATA[%v]]></%s>", key, value, key)
	}

	xml += `
    </data>
</scrapingResult>`
	
	return xml, nil
}

// ToCSV converts a ScrapingResult to CSV string
func (sr *ScrapingResult) ToCSV() (string, error) {
	var csv strings.Builder
	
	// Header
	csv.WriteString("Field,Value\n")
	
	// Metadata fields
	csv.WriteString(fmt.Sprintf("task_id,%s\n", sr.TaskID))
	csv.WriteString(fmt.Sprintf("url,%s\n", sr.URL))
	csv.WriteString(fmt.Sprintf("status,%s\n", sr.Status))
	csv.WriteString(fmt.Sprintf("timestamp,%s\n", sr.Timestamp.Format(time.RFC3339)))
	csv.WriteString(fmt.Sprintf("duration,%d\n", sr.Duration))
	csv.WriteString(fmt.Sprintf("cost,%.2f\n", sr.Cost))
	
	if sr.Error != "" {
		csv.WriteString(fmt.Sprintf("error,%s\n", sr.Error))
	}
	
	// Data fields
	for key, value := range sr.Data {
		csv.WriteString(fmt.Sprintf("%s,%v\n", key, value))
	}
	
	return csv.String(), nil
}
