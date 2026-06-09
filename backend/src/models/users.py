from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer
from datetime import date, datetime
from typing import List, Optional


class UsersModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    email_verify_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    email_verify_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    password_reset_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    role: Mapped[str] = mapped_column(default="common", index=True)
    date_of_reg: Mapped[date] = mapped_column(Date, default=date.today)
    password: Mapped[str] = mapped_column()
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    patronymic: Mapped[str] = mapped_column(String(50), nullable=True)


    def __repr__(self) -> str:
        return (
            f"User(id={self.id}, first_name='{self.first_name}', last_name='{self.last_name}', "
            f"email='{self.email}', is_active={self.is_active})"
        )

