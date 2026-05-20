"""add_telegram_recipients

Revision ID: 8cf7b2a1e4d9
Revises: f9481927a2fc
Create Date: 2026-05-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8cf7b2a1e4d9"
down_revision: Union[str, Sequence[str], None] = "f9481927a2fc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "telegram_recipients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_telegram_recipients_telegram_user_id"),
        "telegram_recipients",
        ["telegram_user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_telegram_recipients_telegram_user_id"), table_name="telegram_recipients")
    op.drop_table("telegram_recipients")
