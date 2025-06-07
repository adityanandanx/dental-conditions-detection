# 🐳 Docker Setup for Dobbe Dental Detection

This guide covers how to run the Dobbe dental detection application using Docker.

## Prerequisites

- Docker Engine 20.10+ with BuildKit support
- Docker Compose 2.0+
- At least 4GB RAM available for containers

## Quick Start

### Production Deployment

1. **Clone and setup environment:**

   ```bash
   git clone <repository-url>
   cd dobbe
   cp .env.example .env
   # Edit .env with your ROBOFLOW_API_KEY
   ```

2. **Build and run:**

   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development Mode

For development with hot reloading and file watching:

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Use watch mode (Docker Compose 2.22+)
docker compose -f docker-compose.dev.yml watch
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
ROBOFLOW_API_KEY=your_roboflow_api_key_here

# Optional
COMPOSE_PROJECT_NAME=dobbe
FRONTEND_PORT=3000
BACKEND_PORT=8000
```

### Docker Images

The setup uses multi-stage builds for optimal image sizes:

- **Backend**: Python 3.12 slim with uv for dependency management
- **Frontend**: Node.js 20 slim with pnpm for package management

## Commands

### Build Images

```bash
# Build all services
docker compose build

# Build specific service
docker compose build backend
docker compose build frontend
```

### Run Services

```bash
# Production mode
docker compose up -d

# Development mode with logs
docker compose -f docker-compose.dev.yml up

# Scale services (if needed)
docker compose up --scale backend=2
```

### Manage Services

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart

# Stop services
docker compose down

# Remove everything including volumes
docker compose down -v --remove-orphans
```

### Development Workflow

```bash
# Rebuild after dependency changes
docker compose -f docker-compose.dev.yml up --build

# Execute commands in running containers
docker compose exec backend /app/.venv/bin/python -m pytest
docker compose exec frontend pnpm lint

# Shell access
docker compose exec backend bash
docker compose exec frontend sh
```

## Production Considerations

### Security

- Non-root users in containers
- Read-only file systems where possible
- Resource limits configured
- Health checks enabled

### Performance

- Multi-stage builds minimize image sizes
- BuildKit cache mounts for faster builds
- Persistent volumes for caches
- Optimized layer caching

### Monitoring

- Health checks for both services
- Proper logging configuration
- Graceful shutdown handling

## Troubleshooting

### Common Issues

1. **Port conflicts:**

   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   ```

2. **Build cache issues:**

   ```bash
   # Clear build cache
   docker builder prune

   # Rebuild without cache
   docker compose build --no-cache
   ```

3. **Permission issues:**

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Memory issues:**

   ```bash
   # Check Docker memory usage
   docker stats

   # Increase Docker memory limit in Docker Desktop
   ```

### Health Check Failures

If health checks fail:

```bash
# Check service logs
docker compose logs backend
docker compose logs frontend

# Test endpoints manually
curl http://localhost:8000/api/v1/health
curl http://localhost:3000/api/health
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Next.js)     │◄──►│   (FastAPI)     │
│   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Docker Network
```

## File Structure

```
dobbe/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── .env                        # Environment variables
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore          # Backend build exclusions
│   └── ...
└── frontend/
    ├── Dockerfile              # Frontend container definition
    ├── .dockerignore          # Frontend build exclusions
    └── ...
```
