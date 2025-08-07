# Docker Setup Guide

This guide helps you run the Onboardr application using Docker for faster loading and easier deployment.

## Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose V2
- At least 4GB of free RAM

## Quick Start

### Development Mode (with hot reload)

```bash
# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f web-dev
```

Access the application at http://localhost:3000

### Production Mode

```bash
# Build and start production environment
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f web
```

## Features

### Optimized Build Process
- Multi-stage Docker builds for smaller images
- Layer caching for faster rebuilds
- pnpm for efficient dependency management
- BuildKit cache mounts for persistent package cache

### Development Features
- Hot reload enabled
- Source code mounted as volumes
- PostgreSQL database with pgAdmin (optional)
- Redis for caching and orchestration
- Health checks for all services

### Production Features
- Optimized Node.js runtime
- Non-root user for security
- Health checks and auto-restart
- PostgreSQL with performance tuning
- Redis with memory limits and persistence

## Commands

### Build Commands
```bash
# Build only (without starting)
docker-compose build

# Build with no cache
docker-compose build --no-cache

# Build specific service
docker-compose build web
```

### Container Management
```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart a service
docker-compose restart web

# View running containers
docker-compose ps
```

### Database Access
```bash
# Access PostgreSQL
docker-compose exec db psql -U postgres -d onboardr

# Backup database
docker-compose exec db pg_dump -U postgres onboardr > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres onboardr < backup.sql
```

### Redis Access
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis in real-time
docker-compose exec redis redis-cli monitor
```

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# Follow logs for specific service
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 web
```

## Performance Tips

1. **Enable BuildKit** for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   export COMPOSE_DOCKER_CLI_BUILD=1
   ```

2. **Prune unused resources** periodically:
   ```bash
   docker system prune -a --volumes
   ```

3. **Use development mode** for active development with hot reload

4. **Pre-build production image** for deployment:
   ```bash
   docker-compose build web
   docker tag onboardr-web:latest your-registry/onboardr-web:latest
   docker push your-registry/onboardr-web:latest
   ```

## Troubleshooting

### Port Already in Use
```bash
# Change port in docker-compose.yml or use environment variable
PORT=3001 docker-compose up
```

### Permission Issues (Linux)
```bash
# Fix ownership
sudo chown -R $USER:$USER ./apps/web
```

### Build Failures
```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database Connection Issues
Ensure the database is healthy before the web service starts:
```bash
docker-compose ps
# Check if db service shows "healthy"
```

## Environment Variables

Create `.env` file in the root directory:

```env
# Ports
PORT=3000
DB_PORT=5432
REDIS_PORT=6379

# Database
POSTGRES_DB=onboardr
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Application
STELLAR_NETWORK=testnet
NEXTAUTH_SECRET=your-secret-key
# Add other required environment variables
```

## Production Deployment

For production deployment:

1. Use secrets management (Docker Secrets, Kubernetes Secrets, etc.)
2. Enable SSL/TLS with a reverse proxy (nginx, traefik)
3. Set up monitoring and logging
4. Configure backup strategies
5. Use container orchestration (Kubernetes, Docker Swarm)

## Additional Tools

### pgAdmin (Database UI)
```bash
# Start with pgAdmin
docker-compose -f docker-compose.dev.yml --profile tools up

# Access at http://localhost:5050
# Default credentials: admin@example.com / admin
```

### Health Checks
All services include health checks. Monitor status:
```bash
docker-compose ps
# Look for (healthy) status
```

## Support

For issues or questions, check the logs first:
```bash
docker-compose logs --tail=50 web
```

Then refer to the main README.md for application-specific troubleshooting.