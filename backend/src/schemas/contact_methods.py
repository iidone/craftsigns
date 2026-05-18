from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ContactMethodCreate(BaseModel):
    type: str
    value: str
    comment: Optional[str] = None


class ContactMethodResponse(BaseModel):
    id: int
    user_id: int
    type: str
    value: str
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
