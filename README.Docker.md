# Docker Deployment Guide

This guide explains how to deploy the LeetCode Solution Tracker using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured

## Quick Start

1. **Clone and prepare the project:**
   ```bash
   git clone <your-repo-url>
   cd leetcode-tracker
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Build and start the application:**
   ```bash
   docker-compose up --build
   ```

The application will be available at `http://localhost:5000`

## Environment Configuration

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session management
- `POSTGRES_PASSWORD`: Database password

### Optional Variables

- `REPL_ID`, `REPLIT_DOMAINS`, `ISSUER_URL`: For Replit authentication
- `OPENAI_API_KEY`: For enhanced AI features

## Production Deployment

### Using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d
```

### Using Docker only

```bash
# Build the image
docker build -t leetcode-tracker .

# Run with PostgreSQL
docker run -d --name postgres \
  -e POSTGRES_DB=leetcode_tracker \
  -e POSTGRES_PASSWORD=your_password \
  postgres:15-alpine

# Run the application
docker run -d --name leetcode-app \
  --link postgres:postgres \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://postgres:your_password@postgres:5432/leetcode_tracker \
  -e SESSION_SECRET=your_session_secret \
  leetcode-tracker
```

## Database Setup

The database tables are automatically created when the application starts. The initialization script (`init.sql`) sets up:

- Sessions table for user authentication
- Required indexes and permissions

## Health Monitoring

The Docker image includes a health check that verifies:
- Application is responding on port 5000
- Basic endpoint accessibility

## Volumes and Persistence

- PostgreSQL data is persisted in a Docker volume
- Upload files (if any) are stored in `/app/uploads`

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL container is running
   - Check network connectivity between containers

2. **Authentication not working:**
   - Verify SESSION_SECRET is set
   - Check Replit authentication variables if using Replit Auth

3. **Application won't start:**
   - Check logs: `docker-compose logs app`
   - Verify all required environment variables are set

### Logs

```bash
# View application logs
docker-compose logs app

# View database logs
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f
```

## Security Considerations

- Change default passwords in production
- Use strong SESSION_SECRET values
- Consider using Docker secrets for sensitive data
- Run containers as non-root users (already configured)
- Keep Docker images updated

## Scaling

For production scaling, consider:
- Using external PostgreSQL service
- Load balancer for multiple app instances
- Redis for session storage
- Container orchestration (Kubernetes, Docker Swarm)