# ScraperGo - Golang Scraping Service

This is the Golang-based scraping service that runs on EC2 instances and processes scraping tasks from SQS. It's designed to be highly concurrent, efficient, and scalable.

## Architecture

The service consists of several key components:

- **SQS Consumer**: Polls SQS for new scraping tasks
- **Job Processor**: Manages a pool of goroutines to process tasks concurrently
- **Scraper Engine**: Handles the actual scraping using Colly (HTML) or Chrome headless (JS)
- **S3 Uploader**: Saves results to S3
- **Reporter**: Sends status updates back to the Node.js API

## Features

- **Concurrent Processing**: Uses goroutine pools for efficient task processing
- **Dual Scraping Modes**: HTML-only scraping with Colly and JS rendering with Chrome headless
- **AWS Integration**: Native SQS, S3, and DynamoDB integration
- **Error Handling**: Robust retry logic and error reporting
- **Proxy Support**: Optional proxy rotation for avoiding blocks
- **Cost Tracking**: Calculates and reports costs per scraping job
- **Health Monitoring**: Built-in health checks and status reporting

## Prerequisites

- Go 1.21 or later
- Docker (for containerized deployment)
- AWS credentials configured
- Chrome/Chromium (for JS rendering)

## Configuration

Copy the environment file and configure your settings:

```bash
cp env.example .env
```

Required environment variables:

- `AWS_REGION`: AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `SQS_QUEUE_URL`: SQS queue URL for receiving tasks
- `S3_BUCKET_NAME`: S3 bucket for storing results
- `NODE_API_URL`: Node.js API URL for status updates
- `API_KEY`: API key for authentication

Optional configuration:

- `MAX_CONCURRENT_JOBS`: Maximum concurrent jobs (default: 100)
- `WORKER_POOL_SIZE`: Number of worker goroutines (default: 10)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LOG_FORMAT`: Log format (json, text)
- `USE_PROXY_ROTATION`: Enable proxy rotation (true/false)
- `PROXY_LIST`: Comma-separated list of proxies
- `MAX_RETRIES`: Maximum retry attempts (default: 3)
- `RETRY_DELAY`: Delay between retries (default: 5s)

## Building

### Local Build

```bash
# Install dependencies
go mod download

# Build the application
go build -o scraper-go .

# Run the application
./scraper-go
```

### Docker Build

```bash
# Build Docker image
docker build -t scraper-go .

# Run with Docker Compose
docker-compose up -d
```

## Deployment on EC2

### Using Docker

1. Build the Docker image on your EC2 instance
2. Configure environment variables
3. Run the container:

```bash
docker run -d \
  --name scraper-go \
  --env-file .env \
  --restart unless-stopped \
  scraper-go
```

### Using Systemd

1. Build the binary
2. Create a systemd service file
3. Enable and start the service:

```bash
sudo systemctl enable scraper-go
sudo systemctl start scraper-go
```

## Task Message Format

The service expects SQS messages in the following format:

```json
{
  "task_id": "unique-task-id",
  "url": "https://example.com",
  "schema": {
    "title": {
      "selector": "h1",
      "type": "text"
    },
    "price": {
      "selector": ".price",
      "type": "text",
      "transform": "trim"
    },
    "images": {
      "selector": "img",
      "type": "list",
      "attr": "src"
    }
  },
  "options": {
    "user_agent": "Custom User Agent",
    "timeout": 30,
    "enable_js": false,
    "wait_for_element": ".content",
    "headers": {
      "Accept": "text/html"
    },
    "proxy_url": "http://proxy:port",
    "max_retries": 3,
    "retry_delay": 5,
    "respect_robots": true
  },
  "callback_url": "https://your-api.com/callback",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Schema Configuration

The scraping schema supports the following field types:

- **text**: Extract text content
- **html**: Extract HTML content
- **attr**: Extract attribute values
- **list**: Extract multiple values as an array

Field configuration options:

- `selector`: CSS selector for the element
- `type`: Field type (text, html, attr, list)
- `attr`: Attribute name (for attr type)
- `transform`: Text transformation (lowercase, uppercase, trim)

## Monitoring and Logging

The service provides comprehensive logging and monitoring:

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Status Updates**: Real-time status updates to the Node.js API
- **Error Reporting**: Detailed error information and stack traces
- **Performance Metrics**: Duration and cost tracking per job
- **Health Checks**: Built-in health check endpoint

## Scaling

The service is designed to scale horizontally:

1. **Auto Scaling Groups**: Configure EC2 Auto Scaling Groups
2. **Load Balancing**: SQS automatically distributes tasks
3. **Worker Pool**: Adjust `WORKER_POOL_SIZE` based on instance capacity
4. **Concurrent Jobs**: Tune `MAX_CONCURRENT_JOBS` for optimal performance

## Troubleshooting

### Common Issues

1. **SQS Connection Issues**: Check AWS credentials and region
2. **S3 Upload Failures**: Verify bucket permissions and configuration
3. **Chrome Headless Issues**: Ensure Chrome is installed and accessible
4. **Memory Issues**: Adjust worker pool size and concurrent job limits

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
export LOG_LEVEL=debug
./scraper-go
```

### Health Check

The service includes a health check endpoint for monitoring:

```bash
curl http://localhost:8080/health
```

## Development

### Running Tests

```bash
go test ./...
```

### Code Formatting

```bash
go fmt ./...
```

### Linting

```bash
golangci-lint run
```

## License

This project is part of the ScraperLayer service and is proprietary software.
