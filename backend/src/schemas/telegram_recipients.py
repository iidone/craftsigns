from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TelegramRecipientCreate(BaseModel):
    telegram_user_id: int


class TelegramRecipientResponse(BaseModel):
    id: int
    telegram_user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
