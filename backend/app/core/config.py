from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Dobbe Backend"
    debug: bool = False
    roboflow_api_key: str

    # OpenAI configuration for diagnostic reports
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # Model configuration
    default_model_id: str = "adr/6"

    # File upload settings - Define constants clearly
    MAX_FILE_SIZE_MB: int = 10
    max_file_size: int = MAX_FILE_SIZE_MB * 1024 * 1024  # 10MB in bytes
    allowed_file_types: list = ["image/jpeg", "image/png", "image/jpg"]
    allowed_dicom_file_types: list = ["application/dicom", "application/octet-stream"]

    # File type extensions for validation
    ALLOWED_IMAGE_EXTENSIONS: list = [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"]
    ALLOWED_DICOM_EXTENSIONS: list = [".dcm", ".dicom", ".DCM", ".DICOM"]

    # Celery and Redis configuration
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"
    redis_url: str = "redis://redis:6379/1"

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
