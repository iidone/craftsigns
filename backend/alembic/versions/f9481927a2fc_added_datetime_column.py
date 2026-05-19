"""added datetime column

Revision ID: f9481927a2fc
Revises: 2d6292329baa
Create Date: 2026-05-19 10:35:53.573087

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9481927a2fc'
down_revision: Union[str, Sequence[str], None] = '2d6292329baa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
