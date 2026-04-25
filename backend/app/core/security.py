from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityService:
    def hash_password(self, plain: str) -> str:
        raise NotImplementedError

    def verify_password(self, plain: str, hashed: str) -> bool:
        raise NotImplementedError

    def create_access_token(self, subject: str, expires_delta: Optional[timedelta] = None) -> str:
        raise NotImplementedError

    def decode_token(self, token: str) -> dict:
        raise NotImplementedError
