from __future__ import annotations

import os
from typing import List

from sqlalchemy import select

from src.models.telegram_recipients import TelegramRecipientModel
from src.models.users import UsersModel
from src.services.EmailService import send_email
from src.database.deps import SessionDep


async def get_admin_moderator_emails(session: SessionDep) -> List[str]:
    result = await session.execute(
        select(UsersModel).where(UsersModel.role.in_(["admin", "moderator"]))
    )
    users = result.scalars().all()
    return [u.email for u in users if getattr(u, "email", None)]


async def get_telegram_recipient_ids(session: SessionDep) -> List[int]:
    result = await session.execute(select(TelegramRecipientModel.telegram_user_id))
    return list(result.scalars().all())


async def send_telegram_message(chat_id: int, text: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return

    try:
        from aiogram import Bot
    except ImportError:
        return

    bot = Bot(token=token)
    try:
        await bot.send_message(chat_id=chat_id, text=text)
    finally:
        await bot.session.close()


async def send_ticket_notification_to_staff(
    *,
    session: SessionDep,
    subject: str,
    body: str,
    background_tasks,
):
    recipients = await get_admin_moderator_emails(session)
    if not recipients:
        recipients = []

    if recipients:
        background_tasks.add_task(
            send_email,
            subject,
            body,
            recipients=recipients,
        )

    telegram_ids = await get_telegram_recipient_ids(session)
    for telegram_id in telegram_ids:
        background_tasks.add_task(send_telegram_message, telegram_id, f"{subject}\n\n{body}")

