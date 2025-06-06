from pydantic import BaseModel, Field
from typing import List


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


class ErrorResponse(BaseModel):
    detail: str
    error_code: str = "VALIDATION_ERROR"
