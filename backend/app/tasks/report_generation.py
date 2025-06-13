import logging
from typing import Dict, Any, List
from celery import Task

from ..core.celery.app import celery_app
from ..websockets.connection import connection_manager
from ..services.diagnostic_service import DiagnosticService, get_diagnostic_service

logger = logging.getLogger(__name__)


class ReportGenerationTask(Task):
    """Base task for diagnostic report generation with progress reporting via WebSockets"""

    def on_success(self, retval, task_id, args, kwargs):
        client_id = kwargs.get("client_id")
        if client_id:
            celery_app.loop.create_task(
                connection_manager.send_update(
                    client_id=client_id,
                    task_id=task_id,
                    status="completed",
                    step="report_generation",
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
                    step="report_generation",
                    data={"error": str(exc)},
                )
            )
        return super().on_failure(exc, task_id, args, kwargs, einfo)


@celery_app.task(bind=True, base=ReportGenerationTask)
async def generate_report(
    self, inference_result: Dict[str, Any], metadata: Dict[str, Any], client_id: str
) -> Dict[str, Any]:
    """
    Generate a diagnostic report based on inference results and metadata

    Args:
        inference_result: The results from the AI model inference
        metadata: DICOM metadata extracted from the file
        client_id: ID of the client to send updates to

    Returns:
        Dictionary containing the diagnostic report
    """
    # Send starting status
    await connection_manager.send_update(
        client_id=client_id,
        task_id=self.request.id,
        status="in_progress",
        step="report_generation",
        data={"message": "Starting diagnostic report generation"},
    )

    try:
        # Get diagnostic service
        diagnostic_service = get_diagnostic_service()

        # Send progress update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="processing",
            step="report_generation",
            data={"progress": 25, "message": "Analyzing detection results"},
        )

        # Generate the diagnostic report
        report = await diagnostic_service.generate_diagnostic_report(
            predictions=inference_result.get("predictions", []), metadata=metadata
        )

        # Send progress update with initial content
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="processing",
            step="report_generation",
            data={
                "progress": 75,
                "message": "Report draft generated",
                "partial_report": {
                    "summary": report.get("summary", ""),
                    "findings_count": len(report.get("findings", [])),
                },
            },
        )

        # Send completion update
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="completed",
            step="report_generation",
            data={
                "progress": 100,
                "message": "Report generation complete",
                "report": report,
            },
        )

        return report

    except Exception as e:
        logger.error(f"Error generating diagnostic report: {str(e)}", exc_info=True)
        await connection_manager.send_update(
            client_id=client_id,
            task_id=self.request.id,
            status="failed",
            step="report_generation",
            data={"error": str(e)},
        )
        raise
