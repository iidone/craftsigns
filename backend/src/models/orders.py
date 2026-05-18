from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database.database import Base
from sqlalchemy import Date, Boolean, String, DECIMAL, DateTime, Integer, ForeignKey
from datetime import date, datetime
from typing import List, Optional

class OrdersModel(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    service_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("services.id", ondelete="SET NULL"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255), default="Новый заказ")
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True)
    stage: Mapped[str] = mapped_column(String(100), default="Черновик")
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    installation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created: Mapped[date] = mapped_column(Date, default=date.today)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"Order(id={self.id}, user_id='{self.user_id}', title='{self.title}', status='{self.status}')"
