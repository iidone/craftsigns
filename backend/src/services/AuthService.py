from sqlalchemy import select
from typing import Optional
from typing_extensions import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.deps import SessionDep
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel
from src.models.users import UsersModel 

env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str):
    password_to_verify = plain_password
    if len(plain_password.encode('utf-8')) > 72:
        password_to_verify = plain_password[:72]
    return pwd_context.verify(password_to_verify, hashed_password)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/users/login")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

token_blacklist = {}


class TokenData(BaseModel):
    email: Optional[str] = None


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def authenticate_user(email: str, password: str, session: AsyncSession):
    user = await get_user_by_email(email, session)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user



async def get_user_by_email(email: str, session: AsyncSession):
    result = await session.execute(
        select(UsersModel).where(UsersModel.email == email)
    )
    return result.scalar_one_or_none()


async def add_to_blacklist(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        expiry = datetime.fromtimestamp(payload["exp"])
        token_blacklist[token] = expiry
    except JWTError:
        pass
    
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep
) -> UsersModel:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if token in token_blacklist:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        raise credentials_exception from e
    
    user = await get_user_by_email(token_data.email, session)
    if user is None:
        raise credentials_exception
    
    return user

def get_password_hash(password: str) -> str:
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

async def check_email_exists(email: str, session: AsyncSession) -> bool:
    result = await session.execute(
        select(UsersModel).where(UsersModel.email == email)
    )
    return result.scalar_one_or_none() is not None