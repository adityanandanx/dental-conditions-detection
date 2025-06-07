# Use Python 3.12 slim image as base
FROM python:3.12-slim-bookworm AS base

# Install system dependencies required for medical imaging libraries and OpenCV
RUN apt-get update && apt-get install -y \
  libgdcm-dev \
  libopenjp2-7-dev \
  libjpeg-dev \
  libpng-dev \
  libgl1-mesa-glx \
  libglib2.0-0 \
  libsm6 \
  libxext6 \
  libxrender-dev \
  libgomp1 \
  libgstreamer1.0-0 \
  libgstreamer-plugins-base1.0-0 \
  && rm -rf /var/lib/apt/lists/*

# Copy uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create app user for security
RUN groupadd --gid 1001 appgroup && \
  useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR /app

# Build stage - install dependencies
FROM base AS builder

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked --no-install-project --no-editable

# Copy application code
COPY . .

# Install the project
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --locked --no-editable

# Production stage
FROM base AS production

# Copy the virtual environment from builder stage
COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv

# Copy application code
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD ["/app/.venv/bin/python", "-c", "import requests; requests.get('http://localhost:8000/api/v1/health')"]

# Run the application
CMD ["/app/.venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]