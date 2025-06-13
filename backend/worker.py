"""
Celery worker entry point for Dobbe's real-time task processing
"""

from app.core.celery import celery_app

if __name__ == "__main__":
    celery_app.worker_main(["worker", "--loglevel=info"])
