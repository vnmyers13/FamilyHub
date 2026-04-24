# PURPOSE: Configuration management for FamilyHub backend
# ROLE: Backend Infrastructure
# MODIFIED: 2026-04-24 — Phase 1.1 setup

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    app_name: str = "FamilyHub"
    version: str = "1"
    debug: bool = False

    # Server
    secret_key: str
    allowed_hosts: str = "familyhub.local,localhost,127.0.0.1"

    # Database
    database_url: str = "sqlite:///./familyhub.db"

    # Security
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Google Calendar (optional)
    google_oauth_client_id: Optional[str] = None
    google_oauth_client_secret: Optional[str] = None
    google_oauth_redirect_uri: Optional[str] = None

    # Push Notifications (optional)
    vapid_public_key: Optional[str] = None
    vapid_private_key: Optional[str] = None

    # Email (optional)
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None

    # Backup
    backup_retention_days: int = 30

    # Photos
    photos_path: str = "/data/photos"
    max_upload_size_mb: int = 100

    # Logging
    log_level: str = "INFO"

    # Development
    mock_google_calendar: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
