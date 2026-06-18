import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime


class TicketCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None

    @field_validator("phone", "email", "description", "name", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        return None if value == "" else value

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            raise ValueError("Имя обязательно")
        v = value.strip()
        if len(v) < 2:
            raise ValueError("Имя должно содержать минимум 2 символа")
        if not re.search(r"[а-яёА-ЯЁa-zA-Z]", v):
            raise ValueError("Имя должно содержать буквы")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if not value:
            return value
        digits = re.sub(r"\D", "", value)
        if len(digits) != 11:
            raise ValueError("Введите полный номер телефона (11 цифр)")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if not value or not value.strip():
            raise ValueError("Описание обязательно")
        return value


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None

class TicketsResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
