from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Annotated
import tempfile
import os
import logging

from ..models.detection import DetectionResponse, ErrorResponse
from ..services.inference_service import InferenceService, get_inference_service
from ..core.config import get_settings, Settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["detection"])


@router.post(
    "/detect",
    response_model=DetectionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file format"},
        413: {"model": ErrorResponse, "description": "File too large"},
        500: {"model": ErrorResponse, "description": "Inference failed"},
    },
)
async def detect_dental_conditions(
    file: UploadFile = File(..., description="Dental image file (JPEG, PNG)"),
    inference_service: Annotated[
        InferenceService, Depends(get_inference_service)
    ] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
) -> DetectionResponse:
    """
    Detect cavities and periapical lesions in uploaded dental image

    This endpoint processes dental X-ray images and returns detected conditions
    with their locations, confidence scores, and classifications.
    """

    # Validate file type
    if file.content_type not in settings.allowed_file_types:
        raise HTTPException(
            status_code=400,
            detail=f"File must be one of: {', '.join(settings.allowed_file_types)}",
        )

    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({settings.max_file_size} bytes)",
        )

    # Save uploaded file temporarily
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.filename or "image.jpg")[1]
        ) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Run inference using the service
        result = await inference_service.detect_dental_conditions(
            temp_file_path, settings.default_model_id
        )

        return DetectionResponse(**result)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in detection endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An unexpected error occurred during processing"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except OSError as e:
                logger.warning(f"Failed to delete temporary file {temp_file_path}: {e}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "dental-detection-api"}
