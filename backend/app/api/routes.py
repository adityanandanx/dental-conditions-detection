from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Annotated
import tempfile
import os
import logging

from ..models.detection import (
    DetectionResponse,
    DicomDetectionResponse,
    ErrorResponse,
    DiagnosticReportResponse,
    DiagnosticReportRequest,
)
from ..services.inference_service import InferenceService, get_inference_service
from ..services.diagnostic_service import (
    DiagnosticReportService,
    get_diagnostic_report_service,
)
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
    file: UploadFile,
    inference_service: Annotated[InferenceService, Depends(get_inference_service)],
    settings: Annotated[Settings, Depends(get_settings)],
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

    # Validate file size efficiently using seek
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file.size} bytes) exceeds maximum allowed size ({settings.max_file_size} bytes)",
        )

    # Read content only once
    content = await file.read()

    # Double-check size if not available from file.size
    if not file.size and len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({len(content)} bytes) exceeds maximum allowed size ({settings.max_file_size} bytes)",
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
        logger.error(f"Unexpected error in detection endpoint: {str(e)}", exc_info=True)
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


@router.post(
    "/detect-dicom",
    response_model=DicomDetectionResponse,
    responses={
        400: {
            "model": ErrorResponse,
            "description": "Invalid DICOM file or parsing error",
        },
        413: {"model": ErrorResponse, "description": "File too large"},
        500: {"model": ErrorResponse, "description": "Processing failed"},
    },
)
async def detect_dental_conditions_dicom(
    file: UploadFile,
    inference_service: Annotated[InferenceService, Depends(get_inference_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> DicomDetectionResponse:
    """
    Detect cavities and periapical lesions in uploaded DICOM file

    This endpoint processes DICOM files by:
    1. Extracting DICOM metadata (patient info, study details, etc.)
    2. Converting the DICOM image to a standard format
    3. Running AI inference to detect dental conditions
    4. Returning all information together

    The response includes:
    - Detection predictions with bounding boxes and confidence scores
    - Complete DICOM metadata
    - Image conversion information
    """

    # Validate file type - DICOM files can have various content types
    allowed_extensions = [".dcm", ".dicom", ".DCM", ".DICOM"]
    file_extension = os.path.splitext(file.filename or "")[1] if file.filename else ""

    if (
        file.content_type not in settings.allowed_dicom_file_types
        and file_extension not in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail=f"File must be a DICOM file (.dcm, .dicom) or have content type: {', '.join(settings.allowed_dicom_file_types)}",
        )

    # Validate file size
    content = await file.read()
    file_size = len(content)

    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({settings.max_file_size} bytes)",
        )

    # Save uploaded DICOM file temporarily
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".dcm") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Process DICOM file: extract metadata, convert to image, and run inference
        inference_results, metadata, image_info = (
            await inference_service.detect_dental_conditions_from_dicom(
                temp_file_path, settings.default_model_id
            )
        )

        return DicomDetectionResponse(
            predictions=inference_results.get("predictions", []),
            metadata=metadata,
            image_info=image_info,
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error in DICOM detection endpoint: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during DICOM processing",
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except OSError as e:
                logger.warning(f"Failed to delete temporary file {temp_file_path}: {e}")


@router.post(
    "/generate-diagnostic-report",
    response_model=DiagnosticReportResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input data"},
        500: {"model": ErrorResponse, "description": "Report generation failed"},
    },
)
async def generate_diagnostic_report_from_detections(
    request: DiagnosticReportRequest,
    diagnostic_service: Annotated[
        DiagnosticReportService, Depends(get_diagnostic_report_service)
    ],
    settings: Annotated[Settings, Depends(get_settings)],
) -> DiagnosticReportResponse:
    """
    Generate a comprehensive diagnostic report from detection results

    This endpoint accepts detection results from previous analysis and generates
    a professional diagnostic report using LangChain and OpenAI.

    The generated report includes:
    - Detailed analysis of detected conditions
    - Professional medical terminology
    - Treatment recommendations
    - Severity assessment
    - Summary of key findings

    This endpoint is designed to be called after /detect-dicom
    to generate reports from existing detection results.
    """

    try:
        # Generate diagnostic report using LangChain
        diagnostic_report = await diagnostic_service.generate_diagnostic_report(
            detections=request.predictions,
            metadata=request.metadata,
            image_info=request.image_info,
        )

        return DiagnosticReportResponse(
            diagnostic_report=diagnostic_report,
            detections_used=request.predictions,
            metadata=request.metadata,
        )

    except Exception as e:
        logger.error(
            f"Unexpected error in diagnostic report generation: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during diagnostic report generation",
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "dental-detection-api"}
