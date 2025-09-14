package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// Config holds all configuration for the scraper service
type Config struct {
	// AWS Configuration
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string

	// SQS Configuration
	SQSQueueURL string

	// S3 Configuration
	S3BucketName string

	// Node.js API Configuration
	NodeAPIURL string
	APIKey     string

	// Worker Configuration
	MaxConcurrentJobs int
	WorkerPoolSize    int

	// Logging Configuration
	LogLevel  string
	LogFormat string

	// Proxy Configuration
	ProxyList           []string
	UseProxyRotation    bool
	CurrentProxyIndex   int

	// Retry Configuration
	MaxRetries int
	RetryDelay time.Duration

	// Scraping Configuration
	DefaultTimeout    int
	DefaultUserAgent  string
	DefaultMaxRetries int
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using environment variables")
	}

	config := &Config{
		AWSRegion:          getEnv("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		SQSQueueURL:        getEnv("SQS_QUEUE_URL", ""),
		S3BucketName:       getEnv("S3_BUCKET_NAME", ""),
		NodeAPIURL:         getEnv("NODE_API_URL", ""),
		APIKey:             getEnv("API_KEY", ""),
		MaxConcurrentJobs:  getEnvAsInt("MAX_CONCURRENT_JOBS", 100),
		WorkerPoolSize:     getEnvAsInt("WORKER_POOL_SIZE", 10),
		LogLevel:           getEnv("LOG_LEVEL", "info"),
		LogFormat:          getEnv("LOG_FORMAT", "json"),
		UseProxyRotation:   getEnvAsBool("USE_PROXY_ROTATION", false),
		MaxRetries:         getEnvAsInt("MAX_RETRIES", 3),
		RetryDelay:         getEnvAsDuration("RETRY_DELAY", 5*time.Second),
		DefaultTimeout:     getEnvAsInt("DEFAULT_TIMEOUT", 30),
		DefaultUserAgent:   getEnv("DEFAULT_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"),
		DefaultMaxRetries:  getEnvAsInt("DEFAULT_MAX_RETRIES", 3),
	}

	// Parse proxy list
	proxyListStr := getEnv("PROXY_LIST", "")
	if proxyListStr != "" {
		config.ProxyList = strings.Split(proxyListStr, ",")
		for i, proxy := range config.ProxyList {
			config.ProxyList[i] = strings.TrimSpace(proxy)
		}
	}

	// Validate required configuration
	if err := config.Validate(); err != nil {
		return nil, err
	}

	return config, nil
}

// Validate checks if all required configuration is present
func (c *Config) Validate() error {
	required := map[string]string{
		"AWS_REGION":        c.AWSRegion,
		"AWS_ACCESS_KEY_ID": c.AWSAccessKeyID,
		"AWS_SECRET_ACCESS_KEY": c.AWSSecretAccessKey,
		"SQS_QUEUE_URL":     c.SQSQueueURL,
		"S3_BUCKET_NAME":    c.S3BucketName,
		"NODE_API_URL":      c.NodeAPIURL,
		"API_KEY":           c.APIKey,
	}

	for key, value := range required {
		if value == "" {
			return fmt.Errorf("required environment variable %s is not set", key)
		}
	}

	return nil
}

// GetNextProxy returns the next proxy in rotation
func (c *Config) GetNextProxy() string {
	if !c.UseProxyRotation || len(c.ProxyList) == 0 {
		return ""
	}

	proxy := c.ProxyList[c.CurrentProxyIndex]
	c.CurrentProxyIndex = (c.CurrentProxyIndex + 1) % len(c.ProxyList)
	return proxy
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
