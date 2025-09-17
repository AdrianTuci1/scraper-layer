# Scraper Layer - Docker Setup

This document explains how to run the Scraper Layer application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- AWS credentials configured

## Quick Start

1. **Clone the repository and navigate to the root directory**
   ```bash
   cd scraperlayer
   ```

2. **Copy the environment file and configure it**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your actual AWS credentials and configuration values.

3. **Build and start the services**
   ```bash
   docker-compose up --build
   ```

4. **Access the services**
   - Node.js API: http://localhost:3000
   - Health checks are available at `/health` endpoints

## Services

### scraper-node
- **Port**: 3000
- **Description**: Node.js API server that handles HTTP requests and coordinates with the Go scraper engine
- **Health Check**: `GET /health`

### scraper-go
- **Port**: Internal (no external port)
- **Description**: Go-based scraper engine that processes scraping jobs from SQS
- **Health Check**: `GET /health` (internal)

## Environment Variables

The `.env.example` file contains all necessary environment variables for both services. Key variables include:

- `AWS_REGION`: AWS region for your resources
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: AWS credentials
- `SQS_QUEUE_URL`: SQS queue URL for job processing
- `S3_BUCKET_NAME`: S3 bucket for storing results
- `API_KEY`: API authentication key

## Development

For development with hot reloading:

```bash
# Start only the Node.js service in development mode
docker-compose up scraper-node --build

# Or run individual services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Deployment

1. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export STAGE=prod
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

## Monitoring

- **View logs**: `docker-compose logs -f [service-name]`
- **Check service status**: `docker-compose ps`
- **Restart services**: `docker-compose restart [service-name]`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 are available
2. **AWS credentials**: Verify your AWS credentials are correctly set in `.env`
3. **SQS/S3 permissions**: Ensure your AWS user has necessary permissions
4. **Memory issues**: Increase Docker memory limits if needed

### Health Checks

Both services include health checks. If a service is unhealthy:

```bash
# Check service logs
docker-compose logs scraper-node
docker-compose logs scraper-go

# Check service status
docker-compose ps
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes and networks
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   scraper-node  │    │   scraper-go    │
│   (API Server)  │◄──►│  (Scraper Engine)│
│   Port: 3000    │    │   Internal      │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
    ┌─────────┐            ┌─────────┐
    │   SQS   │            │    S3   │
    │ (Queue) │            │(Storage)│
    └─────────┘            └─────────┘
```

The Node.js API receives HTTP requests, validates them, and queues jobs in SQS. The Go scraper engine processes jobs from SQS, performs the scraping, and stores results in S3.
