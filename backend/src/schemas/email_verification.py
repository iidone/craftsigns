from pydantic import BaseModel


class EmailVerifyResponse(BaseModel):
    message: str

