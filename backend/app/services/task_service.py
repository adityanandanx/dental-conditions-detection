import logging
import uuid
import tempfile
import os
from typing import Dict, Any, Optional, Tuple

from ..websockets.connection import connection_manager
from ..tasks.dicom_parser import parse_dicom_file
from ..tasks.inference_task import run_inference
from ..tasks.report_generation import generate_report
from ..core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class TaskService:
    """
    Service for orchestrating the task chain:
    1. DICOM parsing
    2. AI model inference
    3. Report generation
    """

    async def start_processing_chain(
        self, file_path: str, client_id: str, model_id: Optional[str] = None
    ) -> str:
        """
        Start the processing chain for a DICOM file

        Args:
            file_path: Path to the uploaded file
            client_id: ID of the client for WebSocket updates
            model_id: Optional model ID to use for inference

        Returns:
            Task chain ID for tracking
        """
        # Generate a unique chain ID
        chain_id = str(uuid.uuid4())

        # Use default model if none provided
        if model_id is None:
            model_id = settings.default_model_id

        try:
            # Send initial status update
            await connection_manager.send_update(
                client_id=client_id,
                task_id=chain_id,
                status="started",
                step="processing_chain",
                data={"message": "Processing chain started"},
            )

            # Start the chain by executing the first task (parse_dicom_file)
            # Each task will trigger the next task in the chain
            async with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                # Copy the uploaded file to the temporary file
                with open(file_path, "rb") as f:
                    temp_file.write(f.read())

                # Start the task chain
                await self._execute_chain(temp_file.name, model_id, client_id, chain_id)

            return chain_id

        except Exception as e:
            logger.error(f"Error starting processing chain: {str(e)}", exc_info=True)
            # Send error status
            await connection_manager.send_update(
                client_id=client_id,
                task_id=chain_id,
                status="failed",
                step="processing_chain",
                data={"error": str(e)},
            )
            raise

    async def _execute_chain(
        self, file_path: str, model_id: str, client_id: str, chain_id: str
    ) -> None:
        """
        Execute the processing task chain

        Args:
            file_path: Path to the temporary file
            model_id: Model ID to use for inference
            client_id: Client ID for WebSocket updates
            chain_id: ID of the task chain
        """
        try:
            # Step 1: Parse DICOM file
            metadata_result, image_info = await parse_dicom_file.delay(
                temp_file_path=file_path, client_id=client_id
            ).get()

            # Step 2: Run model inference
            inference_result = await run_inference.delay(
                temp_file_path=file_path, model_id=model_id, client_id=client_id
            ).get()

            # Step 3: Generate diagnostic report
            report_result = await generate_report.delay(
                inference_result=inference_result,
                metadata=metadata_result,
                client_id=client_id,
            ).get()

            # Send chain completion update
            await connection_manager.send_update(
                client_id=client_id,
                task_id=chain_id,
                status="completed",
                step="processing_chain",
                data={
                    "message": "Processing chain completed successfully",
                    "metadata": metadata_result,
                    "image_info": image_info,
                    "inference": inference_result,
                    "report": report_result,
                },
            )

            # Clean up temp file
            if os.path.exists(file_path):
                os.unlink(file_path)

        except Exception as e:
            logger.error(f"Error in processing chain: {str(e)}", exc_info=True)
            # Send error status
            await connection_manager.send_update(
                client_id=client_id,
                task_id=chain_id,
                status="failed",
                step="processing_chain",
                data={"error": str(e)},
            )
            # Clean up temp file
            if os.path.exists(file_path):
                try:
                    os.unlink(file_path)
                except Exception:
                    pass
            raise


# Singleton instance
_task_service = TaskService()


def get_task_service() -> TaskService:
    """Get the singleton TaskService instance"""
    return _task_service
