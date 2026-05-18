from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.users import router as users_router
from src.api.v1.portfolio_and_services import router as portfolio_and_services_router
from src.api.v1.chat import router as chat_router
from src.api.v1.admin import router as admin_router
from src.api.v1.create_admin import router as create_admin_router
from src.api.v1.dashboard import router as dashboard_router


main_router = APIRouter()

main_router.include_router(health_router)
main_router.include_router(users_router)
main_router.include_router(portfolio_and_services_router)
main_router.include_router(chat_router)
main_router.include_router(admin_router)
main_router.include_router(create_admin_router)
main_router.include_router(dashboard_router)

