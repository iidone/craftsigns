"""add_password_reset_fields

Revision ID: 3e9f1a2b4c5d
Revises: 8cf7b2a1e4d9
Create Date: 2026-06-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3e9f1a2b4c5d"
down_revision: Union[str, Sequence[str], None] = "8cf7b2a1e4d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_reset_token", sa.String(512), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_users_password_reset_token"), "users", ["password_reset_token"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_password_reset_token"), table_name="users")
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token")
