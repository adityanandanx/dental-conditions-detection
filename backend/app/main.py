from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import uvicorn
import asyncio

from .api.routes import router as api_router
from .api.ws_routes import router as ws_router
from .core.config import get_settings
from .core.exceptions import (
    DentalDetectionException,
    global_exception_handler,
    dental_detection_exception_handler,
)
from .core.celery import celery_app

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    settings = get_settings()

    app = FastAPI(
        title="Dobbe Dental Detection API",
        description="AI-powered dental condition detection API for cavities and periapical lesions",
        version="1.0.0",
        debug=settings.debug,
    )

    # Exception handlers
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(
        DentalDetectionException, dental_detection_exception_handler
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router)

    # Include WebSocket routes
    app.include_router(ws_router)

    # Store the event loop for Celery tasks to use with WebSockets
    @app.on_event("startup")
    async def startup_event():
        # Store the event loop in the Celery app for async operations
        celery_app.loop = asyncio.get_event_loop()
        logger.info("FastAPI application started with WebSocket and Celery support")

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "message": "Welcome to Dobbe Dental Detection API",
            "version": "1.0.0",
            "docs": "/docs",
        }

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
