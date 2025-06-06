from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class DentalDetectionException(Exception):
    """Base exception for dental detection errors"""

    pass


class InferenceException(DentalDetectionException):
    """Exception raised when inference fails"""

    pass


class FileValidationException(DentalDetectionException):
    """Exception raised when file validation fails"""

    pass


async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


async def dental_detection_exception_handler(
    request: Request, exc: DentalDetectionException
):
    """Handler for dental detection specific exceptions"""
    logger.error(f"Dental detection error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_code": "DENTAL_DETECTION_ERROR"},
    )
