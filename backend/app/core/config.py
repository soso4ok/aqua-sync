from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int = 5432
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    PORT: int = 3000

    SENTINEL_HUB_CLIENT_ID: str
    SENTINEL_HUB_CLIENT_SECRET: str

    SENTINEL_HUB_TOKEN_URL: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    SENTINEL_HUB_PROCESS_URL: str = "https://sh.dataspace.copernicus.eu/process/v1"
    SENTINEL_HUB_STATS_URL: str = "https://sh.dataspace.copernicus.eu/statistics/v1"
    SENTINEL_HUB_CATALOG_URL: str = "https://sh.dataspace.copernicus.eu/catalog/v1"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    GEMINI_API_KEY: str = ""

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""

    @property
    def r2_endpoint_url(self) -> str:
        return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?ssl=require"
        )


settings = Settings()
