from celery import Celery
from ..config import get_settings

settings = get_settings()

celery_app = Celery(
    "dobbe",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# Configure Celery to find task modules automatically
celery_app.autodiscover_tasks(["app.tasks"])

# Configure task routing
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_publish_retry=True,
    worker_prefetch_multiplier=1,  # Control how many tasks a worker prefetches
    task_acks_late=True,  # Acknowledge tasks after execution (better for long tasks)
)
