from typing_extensions import List
from src.models.portfolio import PortfolioModel
from src.schemas.portfolio import CreatePortfolio, PortfolioResponse
from src.models.services import ServicesModel
from src.schemas.services import ServicesResponse, CreateService
from src.services.AuthService import get_current_user
from src.models.users import UsersModel
from fastapi import APIRouter, HTTPException, status, Depends, Response, Path, Form, File, UploadFile, BackgroundTasks, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete, and_, func
from src.database.deps import SessionDep
from typing import Optional
import os
import uuid
from datetime import date

router = APIRouter(prefix="/v1/portfolio_and_services")

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 20 * 1024 * 1024
UPLOAD_DIR = "static/uploads/portfolio"

STAFF_ROLES = {"admin", "moderator"}


def ensure_staff(user: UsersModel) -> None:
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Доступ только для администратора или модератора")

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename: str) -> str:
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def remove_uploaded_file(photo_url: Optional[str]) -> None:
    if not photo_url or not photo_url.startswith("/static/uploads/"):
        return

    file_path = photo_url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

@router.get("/portfolio", response_model=List[PortfolioResponse], tags=['Портфолио и услуги'], summary=['Получить все элементы портфолио'])
async def get_all_portfolio(session: SessionDep):
    try:
        result = await session.execute(select(PortfolioModel))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error of get portfolio: {str(e)}')
    

@router.get("/services", response_model=List[ServicesResponse], tags=['Портфолио и услуги'], summary=['Получить все услуги'])
async def get_all_services(session: SessionDep):
    try:
        result = await session.execute(select(ServicesModel))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error of get all services: {str(e)}')
    

@router.post("/create_portfolio", response_model=PortfolioResponse, tags=['Портфолио и услуги'], summary=['Добавить элемент портфолио (с загрузкой файла)'])
async def create_portfolio(
    session: SessionDep,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    photo_url: Optional[str] = Form(None),
    photo_file: Optional[UploadFile] = File(None),
    current_user: UsersModel = Depends(get_current_user)
):
    try:
        ensure_staff(current_user)
        final_photo_url = photo_url

        if photo_file:
            contents = await photo_file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Размер файла превышает {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )
            
            if not allowed_file(photo_file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"Недопустимый формат файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
                )

            file_ext = get_file_extension(photo_file.filename)
            unique_filename = f"{uuid.uuid4()}.{file_ext}"

            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            with open(file_path, "wb") as f:
                f.write(contents)
            
            final_photo_url = f"/static/uploads/portfolio/{unique_filename}"

        portfolio = PortfolioModel(
            name=name,
            description=description,
            photo_url=final_photo_url
        )

        session.add(portfolio)
        await session.commit()

        await session.refresh(portfolio)

        return portfolio

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f'error to create portfolio element: {str(e)}')
    

@router.post("/create_service", response_model=ServicesResponse, tags=['Портфолио и услуги'], summary=['Добавить услугу (с загрузкой файла)'])
async def create_service(
    session: SessionDep,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    photo_url: Optional[str] = Form(None),
    photo_file: Optional[UploadFile] = File(None),
    current_user: UsersModel = Depends(get_current_user)
):
    try:
        ensure_staff(current_user)
        final_photo_url = photo_url
        SERVICES_UPLOAD_DIR = "static/uploads/services"

        if photo_file:
            contents = await photo_file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Размер файла превышает {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )
            
            if not allowed_file(photo_file.filename):
                raise HTTPException(
                    status_code=400,
                    detail=f"Недопустимый формат файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
                )

            file_ext = get_file_extension(photo_file.filename)
            unique_filename = f"{uuid.uuid4()}.{file_ext}"

            file_path = os.path.join(SERVICES_UPLOAD_DIR, unique_filename)
            os.makedirs(SERVICES_UPLOAD_DIR, exist_ok=True)
            
            with open(file_path, "wb") as f:
                f.write(contents)
            
            final_photo_url = f"/static/uploads/services/{unique_filename}"

        service = ServicesModel(
            name=name,
            description=description or "",
            photo_url=final_photo_url,
            price=price
        )

        session.add(service)
        await session.commit()

        await session.refresh(service)

        return service

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f'error to create service: {str(e)}')


@router.delete("/portfolio/{portfolio_id}", tags=['Портфолио и услуги'], summary=['Удалить элемент портфолио'])
async def delete_portfolio(
    portfolio_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    try:
        ensure_staff(current_user)
        portfolio = await session.get(PortfolioModel, portfolio_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Элемент портфолио не найден")

        remove_uploaded_file(portfolio.photo_url)
        await session.delete(portfolio)
        await session.commit()
        return {"message": "Элемент портфолио удален"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f'error to delete portfolio element: {str(e)}')


@router.delete("/services/{service_id}", tags=['Портфолио и услуги'], summary=['Удалить услугу'])
async def delete_service(
    service_id: int,
    session: SessionDep,
    current_user: UsersModel = Depends(get_current_user),
):
    try:
        ensure_staff(current_user)
        service = await session.get(ServicesModel, service_id)
        if not service:
            raise HTTPException(status_code=404, detail="Услуга не найдена")

        remove_uploaded_file(service.photo_url)
        await session.delete(service)
        await session.commit()
        return {"message": "Услуга удалена"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f'error to delete service: {str(e)}')
        
