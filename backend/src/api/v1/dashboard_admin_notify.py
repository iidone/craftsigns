from __future__ import annotations

from typing import List

from sqlalchemy import select

from src.models.users import UsersModel
from src.services.EmailService import send_email
from src.database.deps import SessionDep
from src.schemas.tickets import TicketsResponse


async def get_admin_moderator_emails(session: SessionDep) -> List[str]:
    result = await session.execute(
        select(UsersModel).where(UsersModel.role.in_(["admin", "moderator"]))
    )
    users = result.scalars().all()
    return [u.email for u in users if getattr(u, "email", None)]


async def send_ticket_notification_to_staff(
    *,
    session: SessionDep,
    subject: str,
    body: str,
    background_tasks,
):
    recipients = await get_admin_moderator_emails(session)
    if not recipients:
        return

    background_tasks.add_task(
        send_email,
        subject,
        body,
        recipients=recipients,
    )

