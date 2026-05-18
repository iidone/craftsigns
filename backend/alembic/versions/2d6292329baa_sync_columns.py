"""sync_columns

Revision ID: 2d6292329baa
Revises: 9f1a7d5c2b31
Create Date: 2026-05-18 17:27:58.438559

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d6292329baa'
down_revision: Union[str, Sequence[str], None] = '9f1a7d5c2b31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
