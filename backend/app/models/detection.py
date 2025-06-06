from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Detection(BaseModel):
    x: float
    y: float
    width: int
    height: int
    confidence: float
    class_: str = Field(alias="class")
    class_id: int
    detection_id: str


class DetectionResponse(BaseModel):
    predictions: List[Detection]


class DicomMetadata(BaseModel):
    """DICOM metadata fields"""

    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_birth_date: Optional[str] = None
    patient_sex: Optional[str] = None
    study_date: Optional[str] = None
    study_time: Optional[str] = None
    study_description: Optional[str] = None
    series_description: Optional[str] = None
    modality: Optional[str] = None
    manufacturer: Optional[str] = None
    manufacturer_model_name: Optional[str] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    pixel_spacing: Optional[List[float]] = None
    bits_allocated: Optional[int] = None
    bits_stored: Optional[int] = None
    photometric_interpretation: Optional[str] = None
    acquisition_date: Optional[str] = None
    acquisition_time: Optional[str] = None
    institution_name: Optional[str] = None
    referring_physician_name: Optional[str] = None


class ImageInfo(BaseModel):
    """Type-safe model for image conversion information"""

    original_shape: List[int] = Field(description="Original DICOM image dimensions")
    converted_format: str = Field(
        description="Format of the converted image (e.g., 'JPEG')"
    )
    converted_size: List[int] = Field(
        description="Size of converted image [width, height]"
    )
    original_dtype: str = Field(description="Original pixel data type")
    pixel_array_min: float = Field(description="Minimum pixel value in original image")
    pixel_array_max: float = Field(description="Maximum pixel value in original image")
    photometric_interpretation: Optional[str] = Field(
        None, description="DICOM photometric interpretation"
    )
    transfer_syntax: Optional[str] = Field(
        None, description="DICOM transfer syntax UID"
    )


class DicomDetectionResponse(BaseModel):
    """Response model for DICOM file detection"""

    predictions: List[Detection]
    metadata: DicomMetadata
    image_info: ImageInfo


class ErrorResponse(BaseModel):
    detail: str
    error_code: str = "VALIDATION_ERROR"
