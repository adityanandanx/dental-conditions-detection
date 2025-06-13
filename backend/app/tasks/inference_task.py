import logging
from typing import Dict, Any, List
from celery import Task

from ..core.celery.app import celery_app
from ..websockets.connection import connection_manager
from ..services.inference_service import InferenceService, get_inference_service

logger = logging.getLogger(__name__)


class InferenceTask(Task):
    """Base task for AI model inference with progress reporting via WebSockets"""

    def on_success(self, retval, task_id, args, kwargs):
        client_id = kwargs.get("client_id")
        if client_id:
            celery_app.loop.create_task(
                connection_manager.send_update(
                    client_id=client_id,
                    task_id=task_id,
                    status="completed",
                    step="model_inference",
                    data=retval,
                )
            )
        return super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        client_id = kwargs.get("client_id")
        if client_id:
            celery_app.loop.create_task(
                connection_manager.send_update(
                    client_id=client_id,
                    task_id=task_id,
                    status="failed",
                    step="model_inference",
                    data={"error": str(exc)},
                )
            )
        return super().on_failure(exc, task_id, args, kwargs, einfo)


@celery_app.task(bind=True, base=InferenceTask)
async def run_inference(
    self, temp_file_path: str, model_id: str, client_id: str
) -> Dict[str, Any]:
    """
    Run AI model inference on the processed image

    Args:
        temp_file_path: Path to the temporary image file
        model_id: ID of the model to use for inference
        client_id: ID of the client to send updates to

    Returns:
        Dictionary containing inference results
    """
    # Send starting status
    await connection_manager.send_update(
        client_id=client_id,
        task_id=self.request.id,
        status="in_progress",
        step="model_inference",
        data={"message": "Starting model inference"},
    )

    try:
        # Get inference service
        inference_service = get_inference_service()

        # Send progress update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="processing",
            step="model_inference",
            data={"progress": 10, "message": "AI model loaded"},
        )

        # Run the inference on the image
        result = await inference_service.detect_dental_conditions(
            image_path=temp_file_path, model_id=model_id
        )

        # Send progress update with initial results
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="processing",
            step="model_inference",
            data={
                "progress": 75,
                "message": "Raw predictions generated",
                "partial_result": {
                    "predictions_count": len(result.get("predictions", []))
                },
            },
        )

        # Additional post-processing could happen here
        # For example, filtering low-confidence predictions

        # Send completion update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="completed",
            step="model_inference",
            data={
                "progress": 100,
                "message": "Inference complete",
                "predictions": result.get("predictions", []),
            },
        )

        return result

    except Exception as e:
        logger.error(f"Error during model inference: {str(e)}", exc_info=True)
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="failed",
            step="model_inference",
            data={"error": str(e)},
        )
        raise
