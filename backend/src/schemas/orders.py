from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime


class OrderCreate(BaseModel):
    user_id: int
    service_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str = "draft"
    stage: str = "Черновик"
    due_date: Optional[date] = None
    installation_date: Optional[date] = None


class OrderUpdate(BaseModel):
    user_id: Optional[int] = None
    service_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
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
    due_date: Optional[date] = None
    installation_date: Optional[date] = None
    created: Optional[date] = None
    closed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
