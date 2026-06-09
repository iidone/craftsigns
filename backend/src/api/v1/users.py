from typing_extensions import List
from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form, File, UploadFile, BackgroundTasks, Request
import os
from datetime import timedelta

from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete, and_, func
from src.models.users import UsersModel
from src.database.deps import SessionDep
from typing import Optional
import logging
import os
import uuid
from datetime import date, datetime
from src.schemas.users import CreateUser, UserResponse, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest
from src.services.AuthService import (
    add_to_blacklist,
    pwd_context,
    oauth2_scheme,
    create_access_token,
    authenticate_user,
    token_blacklist,
    verify_password,
    check_email_exists,
    get_password_hash,
    get_current_user
)

templates = Jinja2Templates(directory="src/templates")
router = APIRouter(prefix="/v1/users")


@router.get("/users", response_model=List[UserResponse], tags=['Пользователи'], summary=['Получить всех пользователей'])
async def get_all_users(session: SessionDep):
    try:
        result = await session.execute(select(UsersModel))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error of get all users: {str(e)}')


@router.post("/users", response_model=UserResponse, tags=['Пользователи'], summary=['Регистрация'])
async def register_user(session: SessionDep, user_data: CreateUser):
    try:
        existing_user = await check_email_exists(user_data.email, session)
        if existing_user:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

        from src.utils.email_verification import generate_email_verify_token, default_expiry
        from src.services.EmailService import send_email

        hashed_password = get_password_hash(user_data.password)
        token = generate_email_verify_token()
        expires_at = default_expiry(60)

        user = UsersModel(
            email=user_data.email,
            password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            patronymic=user_data.patronymic,
            role="common",
            date_of_reg=date.today(),
            is_active=False,
            email_verify_token=token,
            email_verify_expires_at=expires_at,
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        base_url = os.getenv("EMAIL_VERIFY_BASE_URL") or "http://localhost:8000"
        verify_url = f"{base_url}/v1/users/verify-email?token={token}"

        ok = send_email(
            "Подтвердите email",
            f"Здравствуйте, {user.first_name}!\n\n"
            f"Для активации аккаунта перейдите по ссылке:\n{verify_url}\n\n"
            f"Если вы не создавали аккаунт, просто проигнорируйте письмо.",
            recipients=[user.email],
        )
        if not ok:
            logging.warning("Email not sent to %s", user.email)

        return user

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f'Register error: {str(e)}')


@router.get("/verify-email", tags=["Пользователи"], summary="Подтверждение email")
async def verify_email(token: str, session: SessionDep):
    try:
        result = await session.execute(select(UsersModel).where(UsersModel.email_verify_token == token))
        user = result.scalar_one_or_none()
        if not user or not getattr(user, "email_verify_token", None):
            raise HTTPException(status_code=400, detail="Неверный или использованный токен")

        expires_at = getattr(user, "email_verify_expires_at", None)
        if expires_at and expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Срок действия токена истёк")

        user.is_active = True
        user.email_verify_token = None
        user.email_verify_expires_at = None
        await session.commit()
        return {"message": "Email успешно подтвержден"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Verify error: {str(e)}")


@router.post("/forgot-password", tags=["Пользователи"], summary="Запрос сброса пароля")
async def forgot_password(data: ForgotPasswordRequest, session: SessionDep):
    from src.utils.email_verification import generate_email_verify_token, default_expiry
    from src.services.EmailService import send_email

    try:
        result = await session.execute(select(UsersModel).where(UsersModel.email == data.email))
        user = result.scalar_one_or_none()

        if user:
            token = generate_email_verify_token()
            expires_at = default_expiry(60)
            user.password_reset_token = token
            user.password_reset_expires_at = expires_at
            await session.commit()

            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            reset_url = f"{frontend_url}/reset-password?token={token}"

            send_email(
                "Сброс пароля CraftSigns",
                f"Здравствуйте, {user.first_name}!\n\n"
                f"Для создания нового пароля перейдите по ссылке:\n{reset_url}\n\n"
                f"Ссылка действительна 60 минут.\n\n"
                f"Если вы не запрашивали сброс пароля, просто проигнорируйте письмо.",
                recipients=[user.email],
            )

    except Exception as e:
        logging.warning("Forgot password error: %s", e)

    return {"message": "Если такой email зарегистрирован, вам придёт письмо со ссылкой"}


@router.post("/reset-password", tags=["Пользователи"], summary="Сброс пароля")
async def reset_password(data: ResetPasswordRequest, session: SessionDep):
    try:
        result = await session.execute(
            select(UsersModel).where(UsersModel.password_reset_token == data.token)
        )
        user = result.scalar_one_or_none()

        if not user or not user.password_reset_token:
            raise HTTPException(status_code=400, detail="Неверная или уже использованная ссылка")

        expires_at = user.password_reset_expires_at
        if expires_at and expires_at.replace(tzinfo=None) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Срок действия ссылки истёк. Запросите новое письмо.")

        user.password = get_password_hash(data.new_password)
        user.password_reset_token = None
        user.password_reset_expires_at = None
        await session.commit()

        return {"message": "Пароль успешно изменён"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Reset password error: {str(e)}")


@router.post("/login", tags=["Пользователи"], summary="Авторизация", include_in_schema=False)
async def login_user(
    session: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    try:
        user = await authenticate_user(form_data.username, form_data.password, session)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Неверный email или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not getattr(user, "is_active", False):
            raise HTTPException(status_code=403, detail="Ваш email не подтвержден")

        access_token = create_access_token(data={"sub": user.email})

        await session.commit()

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_info": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "patronymic": user.patronymic,
                "role": user.role,
                "date_of_reg": user.date_of_reg.isoformat() if user.date_of_reg else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка авторизации")

