from typing import Dict, Any, Tuple
import os
import logging
import tempfile
from celery import Task

from ..core.celery.app import celery_app
from ..websockets.connection import connection_manager

logger = logging.getLogger(__name__)


class DicomParserTask(Task):
    """Base task for DICOM parsing with progress reporting via WebSockets"""

    def on_success(self, retval, task_id, args, kwargs):
        client_id = kwargs.get("client_id")
        if client_id:
            # Use the connection manager to send a success update
            celery_app.loop.create_task(
                connection_manager.send_update(
                    client_id=client_id,
                    task_id=task_id,
                    status="completed",
                    step="dicom_parsing",
                    data=retval,
                )
            )
        return super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        client_id = kwargs.get("client_id")
        if client_id:
            # Send failure update
            celery_app.loop.create_task(
                connection_manager.send_update(
                    client_id=client_id,
                    task_id=task_id,
                    status="failed",
                    step="dicom_parsing",
                    data={"error": str(exc)},
                )
            )
        return super().on_failure(exc, task_id, args, kwargs, einfo)


@celery_app.task(bind=True, base=DicomParserTask)
async def parse_dicom_file(
    self, temp_file_path: str, client_id: str
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Parse DICOM file and extract metadata and image

    Args:
        temp_file_path: Path to the temporary DICOM file
        client_id: ID of the client to send updates to

    Returns:
        Tuple containing metadata and image information
    """
    # Send starting status
    await connection_manager.send_update(
        client_id=client_id,
        task_id=self.request.id,
        status="in_progress",
        step="dicom_parsing",
        data={"message": "Starting DICOM file parsing"},
    )

    try:
        # Here we would use pydicom to parse the DICOM file
        # This is a placeholder for the actual implementation
        import pydicom

        # Read the DICOM file
        ds = pydicom.dcmread(temp_file_path)

        # Extract metadata into a dictionary (simplified for now)
        metadata = {
            "PatientID": getattr(ds, "PatientID", "Unknown"),
            "PatientName": str(getattr(ds, "PatientName", "Unknown")),
            "StudyDate": getattr(ds, "StudyDate", "Unknown"),
            "Modality": getattr(ds, "Modality", "Unknown"),
            "SeriesDescription": getattr(ds, "SeriesDescription", "Unknown"),
            # Add more metadata as needed
        }

        # Extract image information
        image_info = {
            "width": int(getattr(ds, "Columns", 0)),
            "height": int(getattr(ds, "Rows", 0)),
            "format": "DICOM",
            # Add more image information as needed
        }

        # Send progress update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="processing",
            step="dicom_parsing",
            data={"progress": 50, "message": "DICOM metadata extracted"},
        )

        # Here you would convert the DICOM pixel data to a standard image format
        # This is where you'd handle windowing, etc.
        # For now, we'll just acknowledge this step

        # Send completion update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="completed",
            step="dicom_parsing",
            data={
                "progress": 100,
                "message": "DICOM parsing complete",
                "metadata": metadata,
                "image_info": image_info,
            },
        )

        return metadata, image_info

    except Exception as e:
        logger.error(f"Error parsing DICOM file: {str(e)}", exc_info=True)
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="failed",
            step="dicom_parsing",
            data={"error": str(e)},
        )
        raise
