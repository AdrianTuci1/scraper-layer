package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
	"scraper-go/config"
)

// HealthChecker handles health check functionality
type HealthChecker struct {
	config     *config.Config
	reporter   *Reporter
	logger     *logrus.Logger
	httpServer *http.Server
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(cfg *config.Config, reporter *Reporter) *HealthChecker {
	logger := logrus.New()
	logger.SetLevel(getLogLevel(cfg.LogLevel))
	if cfg.LogFormat == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{})
	}

	return &HealthChecker{
		config:   cfg,
		reporter: reporter,
		logger:   logger,
	}
}

// StartHealthServer starts the health check HTTP server
func (hc *HealthChecker) StartHealthServer() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", hc.healthHandler)
	mux.HandleFunc("/ready", hc.readyHandler)
	mux.HandleFunc("/metrics", hc.metricsHandler)

	hc.httpServer = &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	hc.logger.Info("Starting health check server on :8080")
	return hc.httpServer.ListenAndServe()
}

// StopHealthServer stops the health check HTTP server
func (hc *HealthChecker) StopHealthServer(ctx context.Context) error {
	hc.logger.Info("Stopping health check server")
	return hc.httpServer.Shutdown(ctx)
}

// healthHandler handles basic health checks
func (hc *HealthChecker) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"healthy","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
}

// readyHandler handles readiness checks
func (hc *HealthChecker) readyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	// Check if we can connect to the Node.js API
	if err := hc.reporter.HealthCheck(); err != nil {
		hc.logger.WithError(err).Warn("Readiness check failed")
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Fprintf(w, `{"status":"not_ready","error":"%s","timestamp":"%s"}`, err.Error(), time.Now().Format(time.RFC3339))
		return
	}
	
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"ready","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
}

// metricsHandler handles basic metrics
func (hc *HealthChecker) metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	
	// Basic metrics in Prometheus format
	fmt.Fprintf(w, `# HELP scraper_go_info Information about the scraper service
# TYPE scraper_go_info gauge
scraper_go_info{version="1.0.0"} 1

# HELP scraper_go_uptime_seconds Uptime in seconds
# TYPE scraper_go_uptime_seconds counter
scraper_go_uptime_seconds %d
`, time.Now().Unix())
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
