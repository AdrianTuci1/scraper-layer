package main

import (
	"encoding/json"
	"testing"
	"time"
	"scraper-go/config"
	"scraper-go/models"
)

func TestScraperEngine_ExtractField(t *testing.T) {
	// This is a basic test structure
	// In a real implementation, you would need to set up proper test fixtures
	
	cfg := &config.Config{
		DefaultUserAgent: "Test Agent",
		DefaultTimeout:   30,
		LogLevel:         "debug",
		LogFormat:        "text",
	}
	
	engine, err := NewScraperEngine(cfg)
	if err != nil {
		t.Fatalf("Failed to create scraper engine: %v", err)
	}
	
	// Test basic field extraction logic
	fieldConfig := map[string]interface{}{
		"selector": "h1",
		"type":     "text",
	}
	
	// This would need proper HTML content and goquery document
	// For now, just test that the engine can be created
	if engine == nil {
		t.Error("Expected scraper engine to be created")
	}
}

func TestTaskMessage_ParseTaskMessage(t *testing.T) {
	jsonData := `{
		"task_id": "test-123",
		"url": "https://example.com",
		"schema": {
			"title": {
				"selector": "h1",
				"type": "text"
			}
		},
		"options": {
			"timeout": 30,
			"enable_js": false
		},
		"created_at": "2023-01-01T00:00:00Z"
	}`
	
	task, err := models.ParseTaskMessage(jsonData)
	if err != nil {
		t.Fatalf("Failed to parse task message: %v", err)
	}
	
	if task.TaskID != "test-123" {
		t.Errorf("Expected task_id 'test-123', got '%s'", task.TaskID)
	}
	
	if task.URL != "https://example.com" {
		t.Errorf("Expected URL 'https://example.com', got '%s'", task.URL)
	}
	
	if task.Options.Timeout != 30 {
		t.Errorf("Expected timeout 30, got %d", task.Options.Timeout)
	}
	
	if task.Options.EnableJS != false {
		t.Errorf("Expected EnableJS false, got %v", task.Options.EnableJS)
	}
}

func TestScrapingResult_ToJSON(t *testing.T) {
	result := &models.ScrapingResult{
		TaskID:    "test-123",
		URL:       "https://example.com",
		Status:    models.TaskStatusCompleted,
		Data:      map[string]interface{}{"title": "Test Title"},
		Timestamp: time.Now(),
	}
	
	jsonData, err := result.ToJSON()
	if err != nil {
		t.Fatalf("Failed to convert result to JSON: %v", err)
	}
	
	if jsonData == "" {
		t.Error("Expected non-empty JSON data")
	}
	
	// Verify it's valid JSON by parsing it back
	var parsedResult models.ScrapingResult
	err = json.Unmarshal([]byte(jsonData), &parsedResult)
	if err != nil {
		t.Fatalf("Failed to parse JSON back: %v", err)
	}
	
	if parsedResult.TaskID != result.TaskID {
		t.Errorf("Expected task_id '%s', got '%s'", result.TaskID, parsedResult.TaskID)
	}
}
