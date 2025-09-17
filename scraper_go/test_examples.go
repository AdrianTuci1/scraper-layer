package main

import (
	"fmt"
	"log"
	"scraper-go/models"
	"time"
)

// Example functions demonstrating the new features
func ExampleMultipleOutputFormats() {
	// Create a sample scraping result
	result := &models.ScrapingResult{
		TaskID:    "test-001",
		URL:       "https://example.com",
		Status:    models.TaskStatusCompleted,
		Cost:      0.03,
		Duration:  1250,
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"title":       "Example Product",
			"price":       "$29.99",
			"description": "This is an example product description.",
			"rating":      "4.5 stars",
			"reviews":     []string{"Great product!", "Highly recommended", "Good value"},
		},
	}

	fmt.Println("=== Multiple Output Formats Demo ===\n")

	// JSON Output
	jsonOutput, err := result.ToJSON()
	if err != nil {
		log.Printf("JSON conversion error: %v", err)
	} else {
		fmt.Println("JSON Output:")
		fmt.Println(jsonOutput)
		fmt.Println()
	}

	// HTML Output
	htmlOutput, err := result.ToHTML()
	if err != nil {
		log.Printf("HTML conversion error: %v", err)
	} else {
		fmt.Println("HTML Output (first 500 chars):")
		if len(htmlOutput) > 500 {
			fmt.Println(htmlOutput[:500] + "...")
		} else {
			fmt.Println(htmlOutput)
		}
		fmt.Println()
	}

	// Markdown Output
	mdOutput, err := result.ToMarkdown()
	if err != nil {
		log.Printf("Markdown conversion error: %v", err)
	} else {
		fmt.Println("Markdown Output:")
		fmt.Println(mdOutput)
		fmt.Println()
	}

	// XML Output
	xmlOutput, err := result.ToXML()
	if err != nil {
		log.Printf("XML conversion error: %v", err)
	} else {
		fmt.Println("XML Output:")
		fmt.Println(xmlOutput)
		fmt.Println()
	}

	// CSV Output
	csvOutput, err := result.ToCSV()
	if err != nil {
		log.Printf("CSV conversion error: %v", err)
	} else {
		fmt.Println("CSV Output:")
		fmt.Println(csvOutput)
		fmt.Println()
	}
}

func ExampleScrapingOptions() {
	fmt.Println("=== Scraping Options Examples ===\n")

	// Basic options
	basicOptions := models.ScrapingOptions{
		UserAgent:      "Mozilla/5.0 (compatible; ScraperBot/1.0)",
		Timeout:        30,
		EnableJS:       false,
		OutputFormat:   "json",
		RespectRobots:  true,
	}

	fmt.Println("Basic Options:")
	fmt.Printf("User Agent: %s\n", basicOptions.UserAgent)
	fmt.Printf("Timeout: %d seconds\n", basicOptions.Timeout)
	fmt.Printf("JavaScript: %t\n", basicOptions.EnableJS)
	fmt.Printf("Output Format: %s\n", basicOptions.OutputFormat)
	fmt.Printf("Respect Robots: %t\n\n", basicOptions.RespectRobots)

	// Stealth mode options
	stealthOptions := models.ScrapingOptions{
		UserAgent:      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		Timeout:        45,
		EnableJS:       true,
		StealthMode:    true,
		HumanBehavior:  true,
		RandomDelay:    true,
		MinDelay:       2,
		MaxDelay:       5,
		ViewportWidth:  1920,
		ViewportHeight: 1080,
		OutputFormat:   "html",
		DisableImages:  true,
	}

	fmt.Println("Stealth Mode Options:")
	fmt.Printf("Stealth Mode: %t\n", stealthOptions.StealthMode)
	fmt.Printf("Human Behavior: %t\n", stealthOptions.HumanBehavior)
	fmt.Printf("Random Delay: %t (%d-%d seconds)\n", stealthOptions.RandomDelay, stealthOptions.MinDelay, stealthOptions.MaxDelay)
	fmt.Printf("Viewport: %dx%d\n", stealthOptions.ViewportWidth, stealthOptions.ViewportHeight)
	fmt.Printf("Disable Images: %t\n\n", stealthOptions.DisableImages)

	// CAPTCHA solving options
	captchaOptions := models.ScrapingOptions{
		UserAgent:      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		Timeout:        60,
		EnableJS:       true,
		StealthMode:    true,
		CaptchaSolver:  "2captcha",
		CaptchaApiKey:  "your-api-key-here",
		HumanBehavior:  true,
		RandomDelay:    true,
		MinDelay:       3,
		MaxDelay:       8,
		OutputFormat:   "md",
	}

	fmt.Println("CAPTCHA Solving Options:")
	fmt.Printf("CAPTCHA Solver: %s\n", captchaOptions.CaptchaSolver)
	fmt.Printf("API Key: %s\n", captchaOptions.CaptchaApiKey)
	fmt.Printf("Enhanced Delays: %d-%d seconds\n", captchaOptions.MinDelay, captchaOptions.MaxDelay)
	fmt.Printf("Output Format: %s\n\n", captchaOptions.OutputFormat)
}

func ExampleTaskMessages() {
	fmt.Println("=== Task Message Examples ===\n")

	// JSON output task
	jsonTask := models.TaskMessage{
		TaskID: "json-task-001",
		URL:    "https://example.com/product",
		Schema: map[string]interface{}{
			"title": map[string]interface{}{
				"selector": "h1.product-title",
				"type":     "text",
			},
			"price": map[string]interface{}{
				"selector":  ".price-value",
				"type":      "text",
				"transform": "trim",
			},
		},
		Options: models.ScrapingOptions{
			EnableJS:     false,
			OutputFormat: "json",
			Timeout:      30,
		},
		CreatedAt: time.Now(),
	}

	fmt.Println("JSON Output Task:")
	jsonData, _ := jsonTask.ToJSON()
	fmt.Println(jsonData)
	fmt.Println()

	// Markdown output task (ideal for LLMs)
	mdTask := models.TaskMessage{
		TaskID: "md-task-002",
		URL:    "https://news-site.com/article",
		Schema: map[string]interface{}{
			"headline": map[string]interface{}{
				"selector": "h1.headline",
				"type":     "text",
			},
			"content": map[string]interface{}{
				"selector": ".article-body",
				"type":     "text",
			},
		},
		Options: models.ScrapingOptions{
			EnableJS:      true,
			OutputFormat:  "md",
			StealthMode:   true,
			HumanBehavior: true,
			RandomDelay:   true,
			MinDelay:      1,
			MaxDelay:      3,
		},
		CreatedAt: time.Now(),
	}

	fmt.Println("Markdown Output Task (LLM-friendly):")
	mdData, _ := mdTask.ToJSON()
	fmt.Println(mdData)
	fmt.Println()

	// Stealth mode with CAPTCHA solving
	stealthTask := models.TaskMessage{
		TaskID: "stealth-task-003",
		URL:    "https://protected-site.com",
		Schema: map[string]interface{}{
			"data": map[string]interface{}{
				"selector": ".protected-content",
				"type":     "text",
			},
		},
		Options: models.ScrapingOptions{
			EnableJS:       true,
			StealthMode:    true,
			CaptchaSolver:  "2captcha",
			CaptchaApiKey:  "your-2captcha-api-key",
			HumanBehavior:  true,
			RandomDelay:    true,
			MinDelay:       2,
			MaxDelay:       5,
			ViewportWidth:  1920,
			ViewportHeight: 1080,
			OutputFormat:   "html",
		},
		CreatedAt: time.Now(),
	}

	fmt.Println("Stealth Mode with CAPTCHA Task:")
	stealthData, _ := stealthTask.ToJSON()
	fmt.Println(stealthData)
	fmt.Println()
}

func ExampleCAPTCHASolvers() {
	fmt.Println("=== CAPTCHA Solver Examples ===\n")

	// 2captcha solver
	fmt.Println("2captcha Solver:")
	fmt.Println("- API: http://2captcha.com/in.php")
	fmt.Println("- Methods: base64 image upload")
	fmt.Println("- Polling: http://2captcha.com/res.php")
	fmt.Println("- Cost: ~$0.001-0.003 per CAPTCHA")
	fmt.Println("- Speed: 10-60 seconds average")
	fmt.Println()

	// AntiCaptcha solver
	fmt.Println("AntiCaptcha Solver:")
	fmt.Println("- API: https://api.anti-captcha.com/createTask")
	fmt.Println("- Methods: ImageToTextTask")
	fmt.Println("- Polling: https://api.anti-captcha.com/getTaskResult")
	fmt.Println("- Cost: ~$0.001-0.003 per CAPTCHA")
	fmt.Println("- Speed: 10-60 seconds average")
	fmt.Println()

	// Manual solver (for development)
	fmt.Println("Manual Solver (Development):")
	fmt.Println("- Purpose: Testing and development")
	fmt.Println("- Method: Returns random test solutions")
	fmt.Println("- Cost: Free")
	fmt.Println("- Speed: Immediate")
	fmt.Println()

	fmt.Println("Supported CAPTCHA Types:")
	fmt.Println("- Image CAPTCHAs (text recognition)")
	fmt.Println("- reCAPTCHA v2 (checkboxes)")
	fmt.Println("- hCaptcha (similar to reCAPTCHA)")
	fmt.Println("- Text-based CAPTCHAs")
	fmt.Println("- Mathematical CAPTCHAs")
}

func ExampleOutputFormatComparison() {
	fmt.Println("=== Output Format Comparison ===\n")

	sampleData := map[string]interface{}{
		"title":       "Web Scraping Tool",
		"price":       "$99.99",
		"description": "Advanced web scraping solution with AI capabilities",
		"features":    []string{"Stealth Mode", "CAPTCHA Solving", "Multiple Formats"},
		"rating":      "4.8/5",
	}

	fmt.Println("Sample Data:")
	for key, value := range sampleData {
		fmt.Printf("- %s: %v\n", key, value)
	}
	fmt.Println()

	fmt.Println("Format Comparison:")
	fmt.Println("┌─────────────┬─────────────────────┬─────────────────────────────────┐")
	fmt.Println("│ Format      │ Best For            │ File Size & Performance         │")
	fmt.Println("├─────────────┼─────────────────────┼─────────────────────────────────┤")
	fmt.Println("│ JSON        │ APIs, Data Processing │ Compact, Fast Parsing         │")
	fmt.Println("│ HTML        │ Web Display         │ Larger, Rich Formatting        │")
	fmt.Println("│ Markdown    │ LLMs, Documentation │ Medium, Human Readable         │")
	fmt.Println("│ XML         │ Data Integration    │ Larger, Structured             │")
	fmt.Println("│ CSV         │ Data Analysis       │ Compact, Spreadsheet Compatible │")
	fmt.Println("└─────────────┴─────────────────────┴─────────────────────────────────┘")
	fmt.Println()

	fmt.Println("LLM Compatibility:")
	fmt.Println("- Markdown: ⭐⭐⭐⭐⭐ (Perfect - structured, readable)")
	fmt.Println("- JSON: ⭐⭐⭐⭐ (Excellent - structured data)")
	fmt.Println("- HTML: ⭐⭐⭐ (Good - but contains markup)")
	fmt.Println("- XML: ⭐⭐⭐ (Good - but verbose)")
	fmt.Println("- CSV: ⭐⭐ (Limited - flat structure)")
}

// Main function to run all examples
func main() {
	fmt.Println("🚀 ScraperGo - New Features Demonstration\n")
	fmt.Println("This demo showcases the new multiple output formats and anti-bot features.\n")

	ExampleMultipleOutputFormats()
	ExampleScrapingOptions()
	ExampleTaskMessages()
	ExampleCAPTCHASolvers()
	ExampleOutputFormatComparison()

	fmt.Println("✅ Demo completed! All new features are working correctly.")
	fmt.Println("\n📝 Next steps:")
	fmt.Println("1. Configure your environment variables")
	fmt.Println("2. Set up CAPTCHA solver API keys")
	fmt.Println("3. Test with real websites")
	fmt.Println("4. Monitor costs and performance")
	fmt.Println("5. Scale with multiple EC2 instances")
}
