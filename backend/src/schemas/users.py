from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import date, datetime

class CreateUser(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    patronymic: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    date_of_reg: date
    role: str

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v