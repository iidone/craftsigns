from datetime import datetime
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select


def canonical_contact_type(type_str: str) -> str:
    """Приводит тип контакта к каноническому виду для корректной проверки уникальности.

    Ожидаемые канонические значения: phone, telegram, whatsapp
    """

    if type_str is None:
        return ""

    t = type_str.strip().lower()

    aliases = {
        "телефон": "phone",
        "phone": "phone",
        "+телефон": "phone",
        "telegram": "telegram",
        "телеграм": "telegram",
        "телеграмм": "telegram",
        "whatsapp": "whatsapp",
        "вацап": "whatsapp",
        "вацапп": "whatsapp",
        "ватсап": "whatsapp",
        "whats app": "whatsapp",
    }

    if t in aliases:
        return aliases[t]

    if "телефон" in t or t == "phone":
        return "phone"
    if "telegram" in t or "телеграм" in t:
        return "telegram"
    if "whatsapp" in t or "вац" in t or "ватс" in t:
        return "whatsapp"

    return t


from src.api.v1.dashboard_admin_notify import send_ticket_notification_to_staff
from src.database.deps import SessionDep
from src.models.contact_methods import ContactMethodModel
from src.models.orders import OrdersModel
from src.models.tickets import TicketsModel
from src.models.users import UsersModel
from src.schemas.contact_methods import ContactMethodCreate, ContactMethodResponse
from src.schemas.orders import OrdersResponse
from src.schemas.tickets import TicketCreate, TicketsResponse
from src.services.AuthService import get_current_user
from src.services.EmailService import send_email


router = APIRouter(prefix="/v1/dashboard", tags=["Личный кабинет"])


@router.post("/public-tickets", response_model=TicketsResponse)
async def create_public_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep,
):
    ticket = TicketsModel(
        user_id=None,
        name=ticket_data.name,
        phone=ticket_data.phone,
        email=ticket_data.email,
        description=ticket_data.description,
        status="new",
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)

    body = (
        f"Имя: {ticket.name}\n"
        f"Телефон: {ticket.phone or '-'}\n"
        f"Email: {ticket.email or '-'}\n"
        f"Описание: {ticket.description or '-'}"
    )

    await send_ticket_notification_to_staff(
        session=session,
        subject="Новая заявка на обратную связь",
        body=body,
        background_tasks=background_tasks,
    )

    return ticket


@router.get("/orders", response_model=List[OrdersResponse])
async def get_my_orders(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    result = await session.execute(
        select(OrdersModel).where(OrdersModel.user_id == current_user.id).order_by(OrdersModel.created.desc())
    )
    return result.scalars().all()


@router.get("/tickets", response_model=List[TicketsResponse])
async def get_my_tickets(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    result = await session.execute(
        select(TicketsModel).where(TicketsModel.user_id == current_user.id).order_by(TicketsModel.created_at.desc())
    )
    return result.scalars().all()


@router.post("/tickets", response_model=TicketsResponse)
async def create_my_ticket(
    ticket_data: TicketCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ticket = TicketsModel(
        user_id=current_user.id,
        name=ticket_data.name,
        phone=ticket_data.phone,
        email=ticket_data.email,
        description=ticket_data.description,
        status="new",
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)

    body = (
        f"Клиент: {current_user.first_name} {current_user.last_name}\n"
        f"Email аккаунта: {current_user.email}\n"
        f"Имя в заявке: {ticket.name}\n"
        f"Телефон: {ticket.phone or '-'}\n"
        f"Email: {ticket.email or '-'}\n"
        f"Описание: {ticket.description or '-'}"
    )

    await send_ticket_notification_to_staff(
        session=session,
        subject="Новая заявка на обратную связь",
        body=body,
        background_tasks=background_tasks,
    )

    return ticket


@router.get("/contact-methods", response_model=List[ContactMethodResponse])
async def get_contact_methods(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    result = await session.execute(
        select(ContactMethodModel)
        .where(ContactMethodModel.user_id == current_user.id)
        .where(ContactMethodModel.type != "Email")
        .order_by(ContactMethodModel.created_at.desc())
    )
    contacts = list(result.scalars().all())

    email_contact = ContactMethodModel(
        id=-1,
        user_id=current_user.id,
        type="Email",
        value=current_user.email,
        comment="Основной email",
        created_at=datetime.now(),
    )

    setattr(email_contact, "is_locked", True)
    setattr(email_contact, "is_virtual", True)

    return [email_contact] + contacts


@router.post("/contact-methods", response_model=ContactMethodResponse)
async def create_contact_method(
    contact_data: ContactMethodCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    if canonical_contact_type(contact_data.type) == "email":
        raise HTTPException(
            status_code=400,
            detail="Email закреплён и не может быть добавлен через форму",
        )

    desired_type_canonical = canonical_contact_type(contact_data.type)

    result = await session.execute(
        select(ContactMethodModel).where(ContactMethodModel.user_id == current_user.id)
    )
    existing_contacts = result.scalars().all()

    for contact in existing_contacts:
        existing_canonical = canonical_contact_type(contact.type)
        if existing_canonical == desired_type_canonical:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"У вас уже есть способ связи типа '{desired_type_canonical}'. "
                    "Нельзя добавить ещё один."
                ),
            )

    contact = ContactMethodModel(
        user_id=current_user.id,
        type=desired_type_canonical,
        value=contact_data.value,
        comment=contact_data.comment,
    )

    session.add(contact)
    await session.commit()
    await session.refresh(contact)

    background_tasks.add_task(
        send_email,
        "Новый способ связи клиента",
        (
            f"Клиент: {current_user.first_name} {current_user.last_name}\n"
            f"Email аккаунта: {current_user.email}\n"
            f"Тип связи: {contact.type}\n"
            f"Значение: {contact.value}\n"
            f"Комментарий: {contact.comment or '-'}"
        ),
    )
    return contact


@router.delete("/contact-methods/{contact_id}")
async def delete_contact_method(
    contact_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    if contact_id == -1:
        raise HTTPException(status_code=400, detail="Нельзя удалить закреплённый email")

    contact = await session.get(ContactMethodModel, contact_id)
    if not contact or contact.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Способ связи не найден")

    if contact.type.lower() == "email":
        raise HTTPException(status_code=400, detail="Нельзя удалить закреплённый email")

    await session.delete(contact)
    await session.commit()
    return {"message": "Способ связи удалён"}

