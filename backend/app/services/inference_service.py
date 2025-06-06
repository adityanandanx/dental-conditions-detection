from inference_sdk import InferenceHTTPClient
from functools import lru_cache
from fastapi import HTTPException
import logging
from ..core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_roboflow_client(api_key: str):
    """Create and cache Roboflow client"""
    client = InferenceHTTPClient(
        api_url="https://serverless.roboflow.com", api_key=api_key
    )
    return client


class InferenceService:
    """Service for handling dental condition detection inference"""

    def __init__(self):
        self.settings = get_settings()

    async def detect_dental_conditions(
        self, image_path: str, model_id: str = "adr/6"
    ) -> dict:
        """
        Run inference on dental image to detect cavities and periapical lesions

        Args:
            image_path: Path to the image file
            model_id: Model ID to use for inference

        Returns:
            dict: Inference results from Roboflow

        Raises:
            HTTPException: If inference fails
        """
        try:
            client = get_roboflow_client(self.settings.roboflow_api_key)
            result = client.infer(image_path, model_id=model_id)
            return result
        except Exception as e:
            logger.error(f"Inference failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


# Dependency function to get inference service
def get_inference_service() -> InferenceService:
    return InferenceService()
