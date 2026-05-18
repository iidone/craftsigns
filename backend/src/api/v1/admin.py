from typing_extensions import List
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy import select
from src.models.users import UsersModel
from src.models.bot_config import BotConfig
from src.models.orders import OrdersModel
from src.models.tickets import TicketsModel
from src.database.deps import SessionDep
from src.services.AuthService import get_current_user
from src.services.EmailService import send_email
from src.schemas.users import UserResponse
from src.schemas.bot_config import BotConfigResponse
from src.schemas.orders import OrderCreate, OrderUpdate, OrdersResponse
from src.models.contact_methods import ContactMethodModel
from src.schemas.contact_methods import ContactMethodResponse

from src.schemas.tickets import TicketsResponse, TicketUpdate
from pydantic import BaseModel
from typing import Dict, List
import json

router = APIRouter(prefix="/v1/admin", tags=['Админ панель'])


@router.get("/users/{user_id}/contact-methods", response_model=List[ContactMethodResponse])
async def get_user_contact_methods(
    user_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)

    result = await session.execute(
        select(ContactMethodModel).where(ContactMethodModel.user_id == user_id).where(ContactMethodModel.type != "Email").order_by(ContactMethodModel.created_at.desc())
    )
    contacts = list(result.scalars().all())

    # закреплённый email берём из users
    user_obj = await session.get(UsersModel, user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user_obj.email:
        email_contact = ContactMethodModel(
            id=-1,
            user_id=user_obj.id,
            type="Email",
            value=user_obj.email,
            comment=None,
            created_at=datetime.utcnow(),
        )
        contacts.insert(0, email_contact)

    return contacts



STAFF_ROLES = {"admin", "moderator"}


def ensure_admin(user: UsersModel) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ только для администраторов")


def ensure_staff(user: UsersModel) -> None:
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Доступ только для администратора или модератора")

@router.get("/users", response_model=List[UserResponse])
async def get_all_users_admin(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    ensure_admin(current_user)
    
    try:
        result = await session.execute(select(UsersModel))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error getting users: {str(e)}')

@router.get("/bot-config")
async def get_bot_config(
    session: SessionDep, 
    current_user: UsersModel = Depends(get_current_user)
):
    ensure_staff(current_user)
    
    try:
        from src.models.bot_config import BotConfig
        import json
        
        result = await session.execute(select(BotConfig).where(BotConfig.id == 1))
        config = result.scalar_one_or_none()
        
        if not config:
            config = BotConfig(id=1, blocks=json.dumps([]))
            session.add(config)
            await session.commit()
            await session.refresh(config)
        
        blocks_data = json.loads(config.blocks) if config.blocks else []

        return {
            "id": config.id,
            "blocks": blocks_data,
            "updated_at": config.updated_at.isoformat() if config.updated_at else None
        }
        
    except Exception as e:
        print(f"Error in get_bot_config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BotConfigUpdate(BaseModel):
    blocks: List[Dict[str, str]]

@router.put("/bot-config", response_model=BotConfigResponse)
async def update_bot_config(
    config_data: BotConfigUpdate,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user)
):
    ensure_staff(current_user)
    
    try:
        config = await session.get(BotConfig, 1)
        if not config:
            config = BotConfig(id=1, blocks=json.dumps(config_data.blocks, ensure_ascii=False))
            session.add(config)
        else:
            config.blocks = json.dumps(config_data.blocks, ensure_ascii=False)
        
        await session.commit()
        await session.refresh(config)
        
        return {
            "id": config.id,
            "blocks": config_data.blocks,
            "updated_at": config.updated_at.isoformat() if config.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/promote")
async def promote_to_admin(
    user_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user)
):
    ensure_admin(current_user)
    
    try:
        user = await session.get(UsersModel, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        user.role = "admin"
        await session.commit()
        await session.refresh(user)
        return {"message": "Пользователь повышен до администратора", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user)
):
    ensure_admin(current_user)
    
    try:
        user = await session.get(UsersModel, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
        
        await session.delete(user)
        await session.commit()
        return {"message": "Пользователь удален"}
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


class UserRoleUpdate(BaseModel):
    role: str


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_admin(current_user)
    if role_data.role not in {"common", "moderator", "admin"}:
        raise HTTPException(status_code=400, detail="Недопустимая роль")

    user = await session.get(UsersModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.role = role_data.role
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/orders", response_model=List[OrdersResponse])
async def get_orders_admin(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    ensure_staff(current_user)
    result = await session.execute(select(OrdersModel).order_by(OrdersModel.created.desc(), OrdersModel.id.desc()))
    return result.scalars().all()


@router.post("/orders", response_model=OrdersResponse)
async def create_order_admin(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)
    client = await session.get(UsersModel, order_data.user_id)
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")

    order = OrdersModel(**order_data.model_dump())
    session.add(order)
    await session.commit()
    await session.refresh(order)

    background_tasks.add_task(
        send_email,
        "Сформирован новый заказ",
        (
            f"Заказ: {order.title}\n"
            f"Клиент: {client.first_name} {client.last_name}\n"
            f"Email клиента: {client.email}\n"
            f"Статус: {order.status}\n"
            f"Стадия: {order.stage}\n"
            f"Описание: {order.description or '-'}"
        ),
    )
    return order


@router.patch("/orders/{order_id}", response_model=OrdersResponse)
async def update_order_admin(
    order_id: int,
    order_data: OrderUpdate,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)
    order = await session.get(OrdersModel, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    values = order_data.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(order, key, value)

    if values.get("status") == "closed" and not order.closed_at:
        order.closed_at = datetime.utcnow()
    elif values.get("status") and values.get("status") != "closed":
        order.closed_at = None

    await session.commit()
    await session.refresh(order)
    return order


@router.post("/orders/{order_id}/close", response_model=OrdersResponse)
async def close_order_admin(
    order_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)
    order = await session.get(OrdersModel, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    order.status = "closed"
    order.stage = "Закрыт"
    order.closed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(order)
    return order


@router.get("/tickets", response_model=List[TicketsResponse])
async def get_tickets_admin(session: SessionDep, current_user: UsersModel = Depends(get_current_user)):
    ensure_staff(current_user)
    result = await session.execute(select(TicketsModel).order_by(TicketsModel.created_at.desc()))
    return result.scalars().all()


@router.patch("/tickets/{ticket_id}", response_model=TicketsResponse)
async def update_ticket_admin(
    ticket_id: int,
    ticket_data: TicketUpdate,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)
    ticket = await session.get(TicketsModel, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    values = ticket_data.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(ticket, key, value)

    if values.get("status") == "closed" and not ticket.closed_at:
        ticket.closed_at = datetime.utcnow()
    elif values.get("status") and values.get("status") != "closed":
        ticket.closed_at = None

    await session.commit()
    await session.refresh(ticket)
    return ticket


@router.post("/tickets/{ticket_id}/close", response_model=TicketsResponse)
async def close_ticket_admin(
    ticket_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    ensure_staff(current_user)
    ticket = await session.get(TicketsModel, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    ticket.status = "closed"
    ticket.closed_at = datetime.utcnow()
    await session.commit()
    await session.refresh(ticket)
    return ticket

