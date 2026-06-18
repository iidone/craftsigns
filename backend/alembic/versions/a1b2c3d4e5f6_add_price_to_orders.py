"""add price to orders

Revision ID: a1b2c3d4e5f6
Revises: 3e9f1a2b4c5d
Create Date: 2026-06-18 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "3e9f1a2b4c5d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("price", sa.Numeric(12, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "price")
