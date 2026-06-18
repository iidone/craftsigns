from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime


class OrderCreate(BaseModel):
    user_id: int
    service_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str = "draft"
    stage: str = "Черновик"
    price: Optional[Decimal] = None
    due_date: Optional[date] = None
    installation_date: Optional[date] = None

    @field_validator("due_date", "installation_date", mode="before")
    @classmethod
    def date_not_in_past(cls, value):
        if value is None:
            return value
        d = value if isinstance(value, date) else date.fromisoformat(str(value))
        if d < date.today():
            raise ValueError("Нельзя указывать прошедшую дату")
        return d


class OrderUpdate(BaseModel):
    user_id: Optional[int] = None
    service_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    price: Optional[Decimal] = None
    due_date: Optional[date] = None
    installation_date: Optional[date] = None


class OrdersResponse(BaseModel):
    id: int
    user_id: int
    service_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    stage: str
    price: Optional[Decimal] = None
    due_date: Optional[date] = None
    installation_date: Optional[date] = None
    created: Optional[date] = None
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
