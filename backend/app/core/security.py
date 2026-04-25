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
            {"sub": subject, "exp": expire},
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    def decode_token(self, token: str) -> dict:
        try:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError as e:
            raise ValueError(f"Invalid token: {e}")
