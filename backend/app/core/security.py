from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityService:
    def hash_password(self, plain: str) -> str:
        return pwd_context.hash(plain)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    def create_access_token(self, subject: str, expires_delta: Optional[timedelta] = None) -> str:
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        )
        return jwt.encode(
            {"sub": subject, "exp": expire, "type": "access"},
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    def create_refresh_token(self, subject: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
        return jwt.encode(
            {"sub": subject, "exp": expire, "type": "refresh"},
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    def decode_token(self, token: str, token_type: str = "access") -> dict:
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError as e:
            raise ValueError(f"Invalid token: {e}")
        if payload.get("type") != token_type:
            raise ValueError(f"Expected {token_type} token")
        return payload
