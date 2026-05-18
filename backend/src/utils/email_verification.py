import secrets
from datetime import datetime, timedelta, timezone


def generate_email_verify_token() -> str:
    # URL-safe token
    return secrets.token_urlsafe(32)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def default_expiry(minutes: int = 60) -> datetime:
    return utcnow() + timedelta(minutes=minutes)

