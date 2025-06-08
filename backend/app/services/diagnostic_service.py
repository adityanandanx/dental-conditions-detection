from typing import List, Dict, Any, Optional, Tuple
import logging
import asyncio
from functools import lru_cache

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseOutputParser
from langchain.schema.output_parser import OutputParserException
import json

from ..models.detection import Detection, DicomMetadata, DiagnosticReport
from ..core.config import Settings, get_settings

logger = logging.getLogger(__name__)


class DiagnosticReportParser(BaseOutputParser[DiagnosticReport]):
    """Custom parser for diagnostic report output"""

    def parse(self, text: str) -> DiagnosticReport:
        try:
            # Try to parse as JSON first
            if text.strip().startswith("{"):
                data = json.loads(text)
                return DiagnosticReport(**data)

            # If not JSON, parse structured text format
            lines = text.strip().split("\n")
            report_lines = []
            summary = ""
            recommendations = []
            severity_level = "moderate"

            current_section = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                if line.lower().startswith("summary:"):
                    current_section = "summary"
                    summary = line[8:].strip()
                elif line.lower().startswith("recommendations:"):
                    current_section = "recommendations"
                elif line.lower().startswith("severity:"):
                    current_section = "severity"
                    severity_level = line[9:].strip().lower()
                elif line.lower().startswith("report:"):
                    current_section = "report"
                    report_lines.append(line[7:].strip())
                elif current_section == "report":
                    report_lines.append(line)
                elif current_section == "recommendations" and line.startswith("-"):
                    recommendations.append(line[1:].strip())
                elif current_section == "summary" and not any(
                    x in line.lower()
                    for x in ["recommendations:", "severity:", "report:"]
                ):
                    summary += " " + line

            return DiagnosticReport(
                report="\n".join(report_lines) if report_lines else text,
                summary=summary or "No specific summary provided",
                recommendations=recommendations or ["Consult with dental professional"],
                severity_level=(
                    severity_level
                    if severity_level in ["low", "moderate", "high"]
                    else "moderate"
                ),
            )

        except Exception as e:
            logger.error(f"Failed to parse diagnostic report: {e}")
            # Fallback to basic report
            return DiagnosticReport(
                report=text,
                summary="Automated analysis completed",
                recommendations=[
                    "Consult with dental professional for detailed evaluation"
                ],
                severity_level="moderate",
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
        self.parser = DiagnosticReportParser()

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

Return your response in this exact JSON format:
{{
    "report": "Full detailed report text",
    "summary": "Brief summary of key findings",
    "recommendations": ["List", "of", "specific", "recommendations"],
    "severity_level": "low|moderate|high"
}}""",
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

        # Create the chain
        self.chain = self.prompt | self.llm | self.parser

    async def generate_diagnostic_report(
        self,
        detections: List[Detection],
        metadata: Optional[DicomMetadata] = None,
        image_info: Optional[Dict[str, Any]] = None,
    ) -> DiagnosticReport:
        """Generate a diagnostic report from detection results"""

        try:
            # Format detections for the prompt
            detection_text = self._format_detections(detections)

            # Format patient info
            patient_info = self._format_patient_info(metadata)

            # Format image info
            image_info_text = self._format_image_info(image_info)

            # Run the chain asynchronously
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.chain.invoke(
                    {
                        "detections": detection_text,
                        "patient_info": patient_info,
                        "image_info": image_info_text,
                    }
                ),
            )

            return result

        except Exception as e:
            logger.error(f"Failed to generate diagnostic report: {e}")
            # Return a fallback report
            return DiagnosticReport(
                report=f"Automated dental analysis detected {len(detections)} findings. Professional evaluation recommended.",
                summary=f"Analysis completed with {len(detections)} detections",
                recommendations=[
                    "Schedule dental consultation",
                    "Professional radiographic interpretation needed",
                ],
                severity_level="moderate",
            )

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
