from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    File,
    UploadFile,
    Form,
    status,
)
from fastapi.responses import JSONResponse
import uuid
from typing import Optional, Dict, Any
import logging
import os
import tempfile
from pathlib import Path

from ..websockets.connection import connection_manager
from ..services.task_service import get_task_service
from ..dependencies.file_validation import validate_dicom_file
from ..core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Create WebSocket router
router = APIRouter()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time communication

    Args:
        websocket: The WebSocket connection
        client_id: Unique client identifier
    """
    await connection_manager.connect(websocket, client_id)
    try:
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            # Here you could process client messages if needed
            # For now, we're just acknowledging receipt
            await websocket.send_json({"status": "received", "message": data})
    except WebSocketDisconnect:
        # Handle client disconnection
        connection_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        connection_manager.disconnect(client_id)


@router.post("/process")
async def process_dicom_file(
    file: UploadFile = File(...),
    client_id: str = Form(...),
    model_id: Optional[str] = Form(None),
):
    """
    Process a DICOM file using the task chain and report updates via WebSocket

    Args:
        file: The uploaded DICOM file
        client_id: Client identifier for WebSocket communication
        model_id: Optional model ID to use for inference

    Returns:
        JSON response with task chain ID
    """
    try:
        # Validate the file
        await validate_dicom_file(file)

        # Save the file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write uploaded file to temp file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Get task service
        task_service = get_task_service()

        # Start processing chain
        chain_id = await task_service.start_processing_chain(
            file_path=temp_file_path, client_id=client_id, model_id=model_id
        )

        # Return the chain ID for tracking
        return {"status": "processing", "chain_id": chain_id}

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        # Clean up temp file if it exists
        if "temp_file_path" in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        # Send error status via WebSocket if client_id is available
        if "client_id" in locals():
            await connection_manager.send_update(
                client_id=client_id,
                task_id=str(uuid.uuid4()),  # Generate a random task ID
                status="error",
                step="file_processing",
                data={"error": str(e)},
            )
        # Return error response
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(e)}
        )


@router.get("/task/{chain_id}")
async def get_task_status(chain_id: str):
    """
    Get the status of a task chain

    Args:
        chain_id: Task chain identifier

    Returns:
        Status of the task chain
    """
    # In a production system, you would fetch status from a database or cache
    # For now, we'll just return a placeholder
    return {
        "status": "Task status endpoint is ready",
        "message": "Real-time updates are provided via WebSocket connection",
    }
