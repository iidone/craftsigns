from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime


class TicketCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None

    @field_validator("phone", "email", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        return None if value == "" else value


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
