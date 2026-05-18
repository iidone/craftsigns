from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, ForeignKey
from datetime import date, datetime
from typing import List, Optional

class TicketsModel(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="new", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"Ticket(id={self.id}, name='{self.name}', status='{self.status}')"
