from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Dobbe Backend"
    debug: bool = False
    roboflow_api_key: str

    # Model configuration
    default_model_id: str = "adr/6"

    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = ["image/jpeg", "image/png", "image/jpg"]
    allowed_dicom_file_types: list = ["application/dicom", "application/octet-stream"]

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
