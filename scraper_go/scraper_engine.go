package main

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"
	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/debug"
	"github.com/sirupsen/logrus"
	"scraper-go/config"
	"scraper-go/models"
)

// ScraperEngine handles the actual scraping logic
type ScraperEngine struct {
	config *config.Config
	logger *logrus.Logger
}

// NewScraperEngine creates a new scraper engine
func NewScraperEngine(cfg *config.Config) (*ScraperEngine, error) {
	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	return &ScraperEngine{
		config: cfg,
		logger: logger,
	}, nil
}

// Scrape performs the actual scraping based on the task message
func (se *ScraperEngine) Scrape(task *models.TaskMessage) (map[string]interface{}, error) {
	se.logger.WithFields(logrus.Fields{
		"task_id": task.TaskID,
		"url":     task.URL,
		"js":      task.Options.EnableJS,
	}).Info("Starting scrape")

	// Validate URL
	if _, err := url.Parse(task.URL); err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Choose scraping method based on options
	if task.Options.EnableJS {
		return se.scrapeWithJS(task)
	}
	return se.scrapeWithColly(task)
}

// scrapeWithColly performs scraping using Colly (for HTML-only sites)
func (se *ScraperEngine) scrapeWithColly(task *models.TaskMessage) (map[string]interface{}, error) {
	se.logger.WithField("task_id", task.TaskID).Debug("Using Colly for scraping")

	// Create a new collector
	c := colly.NewCollector(
		colly.Debugger(&debug.LogDebugger{}),
	)

	// Set user agent
	userAgent := task.Options.UserAgent
	if userAgent == "" {
		userAgent = se.config.DefaultUserAgent
	}
	c.UserAgent = userAgent

	// Set timeout
	timeout := task.Options.Timeout
	if timeout == 0 {
		timeout = se.config.DefaultTimeout
	}
	c.SetRequestTimeout(time.Duration(timeout) * time.Second)

	// Set proxy if provided
	if task.Options.ProxyURL != "" {
		if err := c.SetProxy(task.Options.ProxyURL); err != nil {
			se.logger.WithError(err).Warn("Failed to set proxy, continuing without proxy")
		}
	} else if se.config.UseProxyRotation {
		proxy := se.config.GetNextProxy()
		if proxy != "" {
			if err := c.SetProxy(proxy); err != nil {
				se.logger.WithError(err).Warn("Failed to set rotating proxy, continuing without proxy")
			}
		}
	}

	// Set headers
	if task.Options.Headers != nil {
		c.OnRequest(func(r *colly.Request) {
			for key, value := range task.Options.Headers {
				r.Headers.Set(key, value)
			}
		})
	}

	// Respect robots.txt if enabled
	if task.Options.RespectRobots {
		c.OnRequest(func(r *colly.Request) {
			r.Headers.Set("User-Agent", userAgent)
		})
	}

	var result map[string]interface{}
	var scrapeError error

	// Set up the scraping logic
	c.OnHTML("html", func(e *colly.HTMLElement) {
		se.logger.WithField("task_id", task.TaskID).Debug("Processing HTML content")
		
		// Extract data based on schema
		extractedData, err := se.extractDataFromHTML(e.DOM, task.Schema)
		if err != nil {
			scrapeError = fmt.Errorf("failed to extract data: %w", err)
			return
		}
		result = extractedData
	})

	// Handle errors
	c.OnError(func(r *colly.Response, err error) {
		se.logger.WithError(err).WithFields(logrus.Fields{
			"task_id": task.TaskID,
			"url":     r.Request.URL.String(),
			"status":  r.StatusCode,
		}).Error("Scraping error")
		scrapeError = err
	})

	// Visit the URL
	err := c.Visit(task.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to visit URL: %w", err)
	}

	if scrapeError != nil {
		return nil, scrapeError
	}

	if result == nil {
		return nil, fmt.Errorf("no data extracted from URL")
	}

	se.logger.WithFields(logrus.Fields{
		"task_id": task.TaskID,
		"fields":  len(result),
	}).Info("Scraping completed successfully")

	return result, nil
}

// scrapeWithJS performs scraping using Chrome headless (for JS-heavy sites)
func (se *ScraperEngine) scrapeWithJS(task *models.TaskMessage) (map[string]interface{}, error) {
	se.logger.WithField("task_id", task.TaskID).Debug("Using Chrome headless for scraping")

	// Create context with timeout
	timeout := task.Options.Timeout
	if timeout == 0 {
		timeout = se.config.DefaultTimeout
	}
	
	ctx, cancel := chromedp.NewContext(
		chromedp.WithLogf(se.logger.Debugf),
	)
	defer cancel()

	ctx, cancel = context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer cancel()

	var htmlContent string

	// Set up Chrome options
	opts := []chromedp.Action{
		chromedp.Navigate(task.URL),
	}

	// Wait for specific element if specified
	if task.Options.WaitForElement != "" {
		opts = append(opts, chromedp.WaitVisible(task.Options.WaitForElement))
	} else {
		// Default wait for page load
		opts = append(opts, chromedp.WaitVisible("body"))
	}

	// Get the HTML content
	opts = append(opts, chromedp.OuterHTML("html", &htmlContent))

	// Execute the actions
	err := chromedp.Run(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to run Chrome: %w", err)
	}

	// Parse the HTML content
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract data based on schema
	result, err := se.extractDataFromHTML(doc, task.Schema)
	if err != nil {
		return nil, fmt.Errorf("failed to extract data: %w", err)
	}

	se.logger.WithFields(logrus.Fields{
		"task_id": task.TaskID,
		"fields":  len(result),
	}).Info("JS scraping completed successfully")

	return result, nil
}

// extractDataFromHTML extracts data from HTML based on the provided schema
func (se *ScraperEngine) extractDataFromHTML(doc *goquery.Document, schema map[string]interface{}) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	for fieldName, fieldConfig := range schema {
		fieldData, err := se.extractField(doc, fieldName, fieldConfig)
		if err != nil {
			se.logger.WithError(err).WithField("field", fieldName).Warn("Failed to extract field")
			result[fieldName] = nil
			continue
		}
		result[fieldName] = fieldData
	}

	return result, nil
}

// extractField extracts a single field based on its configuration
func (se *ScraperEngine) extractField(doc *goquery.Document, fieldName string, fieldConfig interface{}) (interface{}, error) {
	configMap, ok := fieldConfig.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid field configuration for %s", fieldName)
	}

	selector, ok := configMap["selector"].(string)
	if !ok {
		return nil, fmt.Errorf("selector is required for field %s", fieldName)
	}

	fieldType, ok := configMap["type"].(string)
	if !ok {
		fieldType = "text" // Default to text extraction
	}

	var result interface{}
	var err error

	switch fieldType {
	case "text":
		result, err = se.extractText(doc, selector, configMap)
	case "html":
		result, err = se.extractHTML(doc, selector, configMap)
	case "attr":
		result, err = se.extractAttribute(doc, selector, configMap)
	case "list":
		result, err = se.extractList(doc, selector, configMap)
	default:
		return nil, fmt.Errorf("unsupported field type: %s", fieldType)
	}

	return result, err
}

// extractText extracts text content from elements
func (se *ScraperEngine) extractText(doc *goquery.Document, selector string, config map[string]interface{}) (string, error) {
	doc.Find(selector).Each(func(i int, s *goquery.Selection) {
		// For now, just get the first match
		if i == 0 {
			text := strings.TrimSpace(s.Text())
			// Apply any transformations if specified
			if transform, ok := config["transform"].(string); ok {
				text = se.applyTransform(text, transform)
			}
			// This is a bit hacky, but works for single value extraction
			// In a real implementation, you'd want to return this properly
		}
	})
	
	// Get the first match
	selection := doc.Find(selector).First()
	if selection.Length() == 0 {
		return "", fmt.Errorf("no elements found for selector: %s", selector)
	}
	
	text := strings.TrimSpace(selection.Text())
	
	// Apply transformation if specified
	if transform, ok := config["transform"].(string); ok {
		text = se.applyTransform(text, transform)
	}
	
	return text, nil
}

// extractHTML extracts HTML content from elements
func (se *ScraperEngine) extractHTML(doc *goquery.Document, selector string, config map[string]interface{}) (string, error) {
	selection := doc.Find(selector).First()
	if selection.Length() == 0 {
		return "", fmt.Errorf("no elements found for selector: %s", selector)
	}
	
	html, err := selection.Html()
	if err != nil {
		return "", err
	}
	
	return html, nil
}

// extractAttribute extracts attribute values from elements
func (se *ScraperEngine) extractAttribute(doc *goquery.Document, selector string, config map[string]interface{}) (string, error) {
	attrName, ok := config["attr"].(string)
	if !ok {
		return "", fmt.Errorf("attr is required for attribute extraction")
	}
	
	selection := doc.Find(selector).First()
	if selection.Length() == 0 {
		return "", fmt.Errorf("no elements found for selector: %s", selector)
	}
	
	attrValue, exists := selection.Attr(attrName)
	if !exists {
		return "", fmt.Errorf("attribute %s not found", attrName)
	}
	
	return attrValue, nil
}

// extractList extracts a list of values from elements
func (se *ScraperEngine) extractList(doc *goquery.Document, selector string, config map[string]interface{}) ([]string, error) {
	var results []string
	
	doc.Find(selector).Each(func(i int, s *goquery.Selection) {
		text := strings.TrimSpace(s.Text())
		if text != "" {
			// Apply transformation if specified
			if transform, ok := config["transform"].(string); ok {
				text = se.applyTransform(text, transform)
			}
			results = append(results, text)
		}
	})
	
	return results, nil
}

// applyTransform applies a transformation to the extracted text
func (se *ScraperEngine) applyTransform(text, transform string) string {
	switch transform {
	case "lowercase":
		return strings.ToLower(text)
	case "uppercase":
		return strings.ToUpper(text)
	case "trim":
		return strings.TrimSpace(text)
	default:
		return text
	}
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
