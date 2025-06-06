from inference_sdk import InferenceHTTPClient
from functools import lru_cache
from fastapi import HTTPException, Depends
from typing_extensions import Annotated
import logging
from .. import config

logger = logging.getLogger(__name__)


@lru_cache
def get_settings():
    return config.Settings()


@lru_cache
def get_roboflow_client(api_key: str):
    client = InferenceHTTPClient(
        api_url="https://serverless.roboflow.com", api_key=api_key
    )
    return client


async def run_inference(
    image_path: str,
    settings: Annotated[config.Settings, Depends(get_settings)],
    model_id: str = "adr/6",
):
    """Run inference on an image using Roboflow model"""
    try:
        client = get_roboflow_client(settings.roboflow_api_key)
        result = client.infer(image_path, model_id=model_id)
        return result
    except Exception as e:
        logger.error(f"Inference failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
