"""expand orders tickets and contacts

Revision ID: 9f1a7d5c2b31
Revises: 200878eecc54
Create Date: 2026-05-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f1a7d5c2b31"
down_revision: Union[str, Sequence[str], None] = "200878eecc54"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("title", sa.String(length=255), nullable=False, server_default="Новый заказ"))
    op.add_column("orders", sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"))
    op.add_column("orders", sa.Column("stage", sa.String(length=100), nullable=False, server_default="Черновик"))
    op.add_column("orders", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column("orders", sa.Column("installation_date", sa.Date(), nullable=True))
    op.add_column("orders", sa.Column("closed_at", sa.DateTime(), nullable=True))
    op.alter_column("orders", "service_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("orders", "description", existing_type=sa.String(), nullable=True)
    op.create_index(op.f("ix_orders_status"), "orders", ["status"], unique=False)

    op.add_column("tickets", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("tickets", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("tickets", sa.Column("status", sa.String(length=50), nullable=False, server_default="new"))
    op.add_column("tickets", sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column("tickets", sa.Column("closed_at", sa.DateTime(), nullable=True))
    op.alter_column("tickets", "user_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("tickets", "description", existing_type=sa.String(), nullable=True)
    op.create_index(op.f("ix_tickets_status"), "tickets", ["status"], unique=False)

    op.create_table(
        "contact_methods",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_methods_type"), "contact_methods", ["type"], unique=False)
    op.create_index(op.f("ix_contact_methods_user_id"), "contact_methods", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_contact_methods_user_id"), table_name="contact_methods")
    op.drop_index(op.f("ix_contact_methods_type"), table_name="contact_methods")
    op.drop_table("contact_methods")

    op.drop_index(op.f("ix_tickets_status"), table_name="tickets")
    op.drop_column("tickets", "closed_at")
    op.drop_column("tickets", "created_at")
    op.drop_column("tickets", "status")
    op.drop_column("tickets", "email")
    op.drop_column("tickets", "phone")

    op.drop_index(op.f("ix_orders_status"), table_name="orders")
    op.drop_column("orders", "closed_at")
    op.drop_column("orders", "installation_date")
    op.drop_column("orders", "due_date")
    op.drop_column("orders", "stage")
    op.drop_column("orders", "status")
    op.drop_column("orders", "title")
