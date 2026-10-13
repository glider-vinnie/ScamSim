from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "dev"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    STORE_BACKEND: str = "memory"
    GOOGLE_CLOUD_PROJECT: str | None = None
    FIRESTORE_DATABASE: str = "(default)"
    GEMINI_ENABLED: bool = False
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    SESSION_TTL_DAYS: int = 30
    RATE_LIMIT_PER_MIN: int = 60
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
