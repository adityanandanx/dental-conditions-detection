.PHONY: help build up down dev logs clean test lint shell health

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Production commands
build: ## Build all Docker images
	docker compose build

up: ## Start production environment
	docker compose up -d

down: ## Stop and remove containers
	docker compose down

# Development commands
dev: ## Start development environment with hot reload
	docker compose -f docker-compose.dev.yml up

dev-build: ## Build and start development environment
	docker compose -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker compose -f docker-compose.dev.yml down

watch: ## Start development with file watching (requires Docker Compose 2.22+)
	docker compose -f docker-compose.dev.yml watch

# Utility commands
logs: ## Show logs from all services
	docker compose logs -f

logs-backend: ## Show backend logs
	docker compose logs -f backend

logs-frontend: ## Show frontend logs
	docker compose logs -f frontend

restart: ## Restart all services
	docker compose restart

health: ## Check health of all services
	@echo "Checking backend health..."
	@curl -f http://localhost:8000/api/v1/health 2>/dev/null && echo " ✓ Backend healthy" || echo " ✗ Backend unhealthy"
	@echo "Checking frontend health..."
	@curl -f http://localhost:3000/api/health 2>/dev/null && echo " ✓ Frontend healthy" || echo " ✗ Frontend unhealthy"

# Development utilities
shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

test-backend: ## Run backend tests
	docker compose exec backend /app/.venv/bin/python -m pytest

lint-frontend: ## Run frontend linting
	docker compose exec frontend pnpm lint

# Cleanup commands
clean: ## Remove containers, volumes, and images
	docker compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Remove everything including images and build cache
	docker compose down -v --remove-orphans --rmi all
	docker system prune -af
	docker builder prune -af

# Setup commands
setup: ## Initial setup - copy env files and build
	@if [ ! -f .env ]; then \
		echo "ROBOFLOW_API_KEY=your_api_key_here" > .env; \
		echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env; \
		echo "Created .env file - please edit with your API keys"; \
	fi
	docker compose build

# Quick commands
quick-start: setup up ## Setup and start production environment
	@echo "Application starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

dev-start: setup dev-build ## Setup and start development environment