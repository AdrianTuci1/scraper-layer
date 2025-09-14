# Makefile for ScraperGo service

# Variables
BINARY_NAME=scraper-go
DOCKER_IMAGE=scraper-go
VERSION=1.0.0
GO_VERSION=1.21

# Default target
.PHONY: all
all: build

# Build the binary
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	go build -o $(BINARY_NAME) .

# Build for Linux (for EC2 deployment)
.PHONY: build-linux
build-linux:
	@echo "Building $(BINARY_NAME) for Linux..."
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_NAME)-linux .

# Run the application
.PHONY: run
run: build
	@echo "Running $(BINARY_NAME)..."
	./$(BINARY_NAME)

# Run with Docker Compose
.PHONY: docker-up
docker-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

# Stop Docker Compose services
.PHONY: docker-down
docker-down:
	@echo "Stopping Docker Compose services..."
	docker-compose down

# Build Docker image
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(VERSION) .
	docker tag $(DOCKER_IMAGE):$(VERSION) $(DOCKER_IMAGE):latest

# Run Docker container
.PHONY: docker-run
docker-run: docker-build
	@echo "Running Docker container..."
	docker run --rm --env-file .env $(DOCKER_IMAGE):latest

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	go clean
	rm -f $(BINARY_NAME) $(BINARY_NAME)-linux
	docker rmi $(DOCKER_IMAGE):$(VERSION) $(DOCKER_IMAGE):latest 2>/dev/null || true

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	golangci-lint run

# Check for security vulnerabilities
.PHONY: security
security:
	@echo "Checking for security vulnerabilities..."
	gosec ./...

# Generate documentation
.PHONY: docs
docs:
	@echo "Generating documentation..."
	godoc -http=:6060

# Setup development environment
.PHONY: setup
setup: deps
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then cp env.example .env; echo "Created .env file from template"; fi
	@echo "Please configure your .env file with the required settings"

# Deploy to EC2 (requires SSH access)
.PHONY: deploy-ec2
deploy-ec2: build-linux
	@echo "Deploying to EC2..."
	@if [ -z "$(EC2_HOST)" ]; then echo "Please set EC2_HOST environment variable"; exit 1; fi
	@if [ -z "$(EC2_USER)" ]; then echo "Please set EC2_USER environment variable"; exit 1; fi
	scp $(BINARY_NAME)-linux $(EC2_USER)@$(EC2_HOST):/tmp/$(BINARY_NAME)
	ssh $(EC2_USER)@$(EC2_HOST) "sudo mv /tmp/$(BINARY_NAME) /usr/local/bin/ && sudo chmod +x /usr/local/bin/$(BINARY_NAME)"

# Create systemd service file
.PHONY: install-service
install-service: build-linux
	@echo "Installing systemd service..."
	@if [ -z "$(EC2_HOST)" ]; then echo "Please set EC2_HOST environment variable"; exit 1; fi
	@if [ -z "$(EC2_USER)" ]; then echo "Please set EC2_USER environment variable"; exit 1; fi
	@echo "Creating systemd service file..."
	@cat > scraper-go.service << 'EOF'
[Unit]
Description=ScraperGo Service
After=network.target

[Service]
Type=simple
User=scraper
Group=scraper
WorkingDirectory=/app
ExecStart=/usr/local/bin/scraper-go
Restart=always
RestartSec=5
EnvironmentFile=/app/.env

[Install]
WantedBy=multi-user.target
EOF
	scp scraper-go.service $(EC2_USER)@$(EC2_HOST):/tmp/
	ssh $(EC2_USER)@$(EC2_HOST) "sudo mv /tmp/scraper-go.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable scraper-go"
	rm scraper-go.service

# Show help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build          - Build the binary"
	@echo "  build-linux    - Build for Linux (EC2 deployment)"
	@echo "  run            - Run the application"
	@echo "  docker-up      - Start with Docker Compose"
	@echo "  docker-down    - Stop Docker Compose services"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run Docker container"
	@echo "  clean          - Clean build artifacts"
	@echo "  deps           - Install dependencies"
	@echo "  test           - Run tests"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  fmt            - Format code"
	@echo "  lint           - Lint code"
	@echo "  security       - Check for security vulnerabilities"
	@echo "  docs           - Generate documentation"
	@echo "  setup          - Setup development environment"
	@echo "  deploy-ec2     - Deploy to EC2 (requires EC2_HOST and EC2_USER)"
	@echo "  install-service - Install systemd service on EC2"
	@echo "  help           - Show this help message"
