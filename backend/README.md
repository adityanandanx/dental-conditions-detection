# Dobbe Backend - Dental Detection API

A FastAPI-based REST API for detecting dental conditions (cavities and periapical lesions) in X-ray images using AI models.

## Project Structure

```
backend/
├── main.py                     # Application entry point
├── config.py                   # Legacy config (redirects to app.core.config)
├── pyproject.toml             # Project dependencies
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app factory
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py          # API endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Application settings
│   │   └── exceptions.py      # Custom exception handlers
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── file_validation.py # Common dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   └── detection.py       # Pydantic models
│   └── services/
│       ├── __init__.py
│       └── inference_service.py # Business logic
└── core/
    └── inference.py           # Legacy inference (to be removed)
```

## API Endpoints

### POST /api/v1/detect

Detects cavities and periapical lesions in dental X-ray images.

**Request:**

- `file`: Image file (JPEG, PNG)
- Max file size: 10MB

**Response:**

```json
{
  "predictions": [
    {
      "x": 346.5,
      "y": 323.5,
      "width": 107,
      "height": 105,
      "confidence": 0.839,
      "class": "pa",
      "class_id": 1,
      "detection_id": "4750150f-4cc3-4e39-8925-9604c7ea2470"
    }
  ]
}
```

### GET /api/v1/health

Health check endpoint.

## Environment Variables

Create a `.env` file in the backend directory:

```env
ROBOFLOW_API_KEY=your_roboflow_api_key_here
DEBUG=false
```

## Installation

1. Install dependencies:

```bash
pip install -e .
```

2. Run the development server:

```bash
python main.py
# or
uvicorn main:app --reload
```

## Features

- **Type-safe**: Full Pydantic model validation
- **Error handling**: Comprehensive exception handling
- **File validation**: Automatic file type and size validation
- **Logging**: Structured logging throughout the application
- **Documentation**: Auto-generated OpenAPI docs at `/docs`
- **Health checks**: Built-in health check endpoint
- **CORS support**: Configurable CORS middleware

## Architecture

The application follows FastAPI best practices with:

- **Separation of concerns**: Clear separation between API, business logic, and data models
- **Dependency injection**: Using FastAPI's dependency system
- **Service layer**: Business logic encapsulated in service classes
- **Exception handling**: Global and custom exception handlers
- **Configuration management**: Environment-based configuration with Pydantic Settings
