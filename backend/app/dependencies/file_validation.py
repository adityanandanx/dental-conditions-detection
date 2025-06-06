"""
Common dependencies for the FastAPI application
"""

from fastapi import Depends, HTTPException, UploadFile
from typing import Annotated
import os

from ..core.config import Settings, get_settings


async def validate_image_file(
    file: UploadFile, settings: Annotated[Settings, Depends(get_settings)]
) -> UploadFile:
    """
    Validate uploaded image file

    Args:
        file: The uploaded file
        settings: Application settings

    Returns:
        UploadFile: The validated file

    Raises:
        HTTPException: If file validation fails
    """
    # Check file type
    if file.content_type not in settings.allowed_file_types:
        raise HTTPException(
            status_code=400,
            detail=f"File must be one of: {', '.join(settings.allowed_file_types)}",
        )

    # Check file size
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size ({settings.max_file_size} bytes)",
        )

    return file
