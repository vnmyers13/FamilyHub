from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Core ──────────────────────────────────────
    family_name: str = "FamilyHub"
    timezone: str = "UTC"
    secret_key: str = ""
    debug: bool = False
    log_level: str = "INFO"

    # ── Database ──────────────────────────────────
    database_url: str = "sqlite+aiosqlite:////data/db/familyhub.db"

    # ── CORS ──────────────────────────────────────
    allowed_origins: str = "https://familyhub.local,http://localhost:5173,http://localhost:3000"

    # ── Calendar Sync ─────────────────────────────
    calendar_sync_interval_minutes: int = 15

    # ── Wall Display ──────────────────────────────
    wall_idle_timeout_seconds: int = 300

    # ── Backups ───────────────────────────────────
    backup_retention_days: int = 30
    backup_time: str = "03:00"

    # ── Photos ────────────────────────────────────
    photos_path: str = "/data/photos"
    max_upload_size_mb: int = 100

    # ── Weather ───────────────────────────────────
    weather_api_key: str = ""
    weather_units: str = "imperial"

    # ── Push Notifications (VAPID) ────────────────
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_contact: str = "mailto:admin@familyhub.local"

    # ── Email ─────────────────────────────────────
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    # ── Development ───────────────────────────────
    mock_google_calendar: bool = False
    mock_microsoft_calendar: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        validate_default=True,
    )

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v or v in ("default-change-in-production", "changeme"):
            raise ValueError(
                "SECRET_KEY must be set in .env and must not use a default value. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        return v


settings = Settings()
