"""add_expires_at_to_reports

Revision ID: c9a3b6f4c2d1
Revises: bd8502a13f90
Create Date: 2026-03-19 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9a3b6f4c2d1"
down_revision: Union[str, None] = "bd8502a13f90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reports", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("reports", "expires_at")
