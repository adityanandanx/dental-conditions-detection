from typing import List, Dict, Any, Optional, Tuple
import logging
import asyncio
from functools import lru_cache

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from ..models.detection import (
    Detection,
    DicomMetadata,
    DiagnosticReport,
    SeverityLevel,
    DEFAULT_DISCLAIMER,
)
from ..core.config import Settings, get_settings
from ..core.exceptions import ReportGenerationException

logger = logging.getLogger(__name__)


class _LLMDiagnosticReport(BaseModel):
    """Schema the LLM is constrained to fill. Server-side fields
    (generated_at, disclaimer) are deliberately excluded so the model
    cannot omit or override them."""

    report: str = Field(description="The generated diagnostic report text")
    summary: str = Field(description="Brief summary of findings")
    recommendations: List[str] = Field(description="Treatment recommendations")
    severity_level: SeverityLevel = Field(
        description="Overall severity: low, moderate, high, or none"
    )


class DiagnosticReportService:
    """Service for generating diagnostic reports using LangChain and OpenAI"""

    def __init__(self):
        self.settings = get_settings()
        self.llm = ChatOpenAI(
            model=self.settings.openai_model,
            api_key=self.settings.openai_api_key,
            temperature=0.1,  # Low temperature for consistent medical reports
        )

        # Create the prompt template
        self.prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a dental AI assistant that generates diagnostic reports based on AI detection results. 
Your role is to analyze dental X-ray detection results and provide a structured, professional medical report.

Guidelines:
- Provide objective analysis based on the detection data
- Use professional medical terminology
- Include specific location and confidence information
- Suggest appropriate follow-up actions
- Maintain a clinical, informative tone
- Always recommend professional consultation
- If no findings are provided, set severity_level to "none" and state that
  no conditions were detected rather than inventing findings""",
                ),
                (
                    "human",
                    """Analyze these dental detection results and generate a diagnostic report:

Detection Results:
{detections}

Patient Information:
{patient_info}

Image Information:
{image_info}

Please provide a comprehensive diagnostic report with specific findings, recommendations, and severity assessment.""",
                ),
            ]
        )

        # Structured output: the model is constrained to the schema and
        # parsing is handled by LangChain, not hand-rolled string slicing.
        self.chain = self.prompt | self.llm.with_structured_output(
            _LLMDiagnosticReport
        )

    async def generate_diagnostic_report(
        self,
        detections: List[Detection],
        metadata: Optional[DicomMetadata] = None,
        image_info: Optional[Dict[str, Any]] = None,
    ) -> DiagnosticReport:
        """Generate a diagnostic report from detection results"""

        # No-findings fallback: do NOT call the LLM, return a clean,
        # truthful "nothing detected" report.
        if not detections:
            return DiagnosticReport(
                report=(
                    "No findings detected in this image. The automated "
                    "analysis did not identify any cavities or periapical "
                    "lesions. This does not rule out conditions that may "
                    "require clinical examination."
                ),
                summary="No findings detected in this image.",
                recommendations=[
                    "Routine dental examination as clinically indicated",
                ],
                severity_level=SeverityLevel.none,
            )

        try:
            # Format detections for the prompt
            detection_text = self._format_detections(detections)

            # Format patient info
            patient_info = self._format_patient_info(metadata)

            # Format image info
            image_info_text = self._format_image_info(image_info)

            # Run the (sync) chain off the event loop.
            llm_result: _LLMDiagnosticReport = await asyncio.to_thread(
                self.chain.invoke,
                {
                    "detections": detection_text,
                    "patient_info": patient_info,
                    "image_info": image_info_text,
                },
            )

            # Map the constrained LLM output onto the real response model.
            # generated_at and disclaimer are applied server-side and
            # cannot be omitted or overridden by the model.
            return DiagnosticReport(
                report=llm_result.report,
                summary=llm_result.summary,
                recommendations=llm_result.recommendations,
                severity_level=llm_result.severity_level,
                disclaimer=DEFAULT_DISCLAIMER,
            )

        except Exception as e:
            # Do NOT fabricate a report on failure. Raise a typed exception so
            # the route returns a structured 503 and the caller never receives
            # a fake diagnosis.
            logger.error(f"Failed to generate diagnostic report: {e}", exc_info=True)
            raise ReportGenerationException(
                "Diagnostic report generation is temporarily unavailable."
            ) from e

    def _format_detections(self, detections: List[Detection]) -> str:
        """Format detection results for the prompt"""
        if not detections:
            return "No significant findings detected in the image."

        formatted = []
        for i, detection in enumerate(detections, 1):
            formatted.append(
                f"Detection {i}:\n"
                f"  - Condition: {detection.class_}\n"
                f"  - Location: ({detection.x}, {detection.y}) with dimensions {detection.width}x{detection.height}\n"
                f"  - Confidence: {detection.confidence:.2%}\n"
                f"  - Detection ID: {detection.detection_id}"
            )

        return "\n\n".join(formatted)

    def _format_patient_info(self, metadata: Optional[DicomMetadata]) -> str:
        """Format patient information from DICOM metadata"""
        if not metadata:
            return "Patient information not available from image metadata."

        info_parts = []

        if metadata.patient_id:
            info_parts.append(f"Patient ID: {metadata.patient_id}")
        if metadata.patient_sex:
            info_parts.append(f"Sex: {metadata.patient_sex}")
        if metadata.study_date:
            info_parts.append(f"Study Date: {metadata.study_date}")
        if metadata.modality:
            info_parts.append(f"Imaging Modality: {metadata.modality}")
        if metadata.institution_name:
            info_parts.append(f"Institution: {metadata.institution_name}")

        return (
            "\n".join(info_parts)
            if info_parts
            else "Limited patient information available."
        )

    def _format_image_info(self, image_info: Optional[Dict[str, Any]]) -> str:
        """Format image technical information"""
        if not image_info:
            return "Image technical details not available."

        info_parts = []

        if "original_shape" in image_info:
            info_parts.append(f"Image dimensions: {image_info['original_shape']}")
        if "photometric_interpretation" in image_info:
            info_parts.append(
                f"Photometric interpretation: {image_info['photometric_interpretation']}"
            )
        if "pixel_array_min" in image_info and "pixel_array_max" in image_info:
            info_parts.append(
                f"Pixel value range: {image_info['pixel_array_min']} - {image_info['pixel_array_max']}"
            )

        return (
            "\n".join(info_parts)
            if info_parts
            else "Standard digital radiograph processing applied."
        )


@lru_cache()
def get_diagnostic_report_service() -> DiagnosticReportService:
    """Dependency injection for diagnostic report service"""
    return DiagnosticReportService()
