import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

PHONE_DIGITS_RE = re.compile(r"^\d{11}$")
TELEGRAM_RE = re.compile(r"^@[a-zA-Z0-9_]{5,32}$")


class ContactMethodCreate(BaseModel):
    type: str
    value: str
    comment: Optional[str] = None

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: str, info) -> str:
        contact_type = info.data.get("type", "")
        if contact_type in ("phone", "whatsapp", "max"):
            digits = re.sub(r"\D", "", value)
            if len(digits) != 11:
                raise ValueError("Введите корректный номер телефона (11 цифр, формат +7 XXXXXXXXXX)")
        elif contact_type == "telegram":
            if not TELEGRAM_RE.match(value):
                raise ValueError("Telegram должен быть в формате @username (5–32 символа: буквы, цифры, _)")
        return value


class ContactMethodResponse(BaseModel):
    id: int
    user_id: int
    type: str
    value: str
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
