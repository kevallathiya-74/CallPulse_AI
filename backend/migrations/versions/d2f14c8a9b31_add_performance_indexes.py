"""add_performance_indexes

Revision ID: d2f14c8a9b31
Revises: c9a3b6f4c2d1
Create Date: 2026-03-19 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d2f14c8a9b31"
down_revision: Union[str, None] = "c9a3b6f4c2d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS ix_calls_status ON calls (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_calls_uploaded_by ON calls (uploaded_by)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_calls_created_at_desc ON calls (created_at DESC)")

    op.execute("CREATE INDEX IF NOT EXISTS ix_analysis_results_composite_score ON analysis_results (composite_score)")

    op.execute("CREATE INDEX IF NOT EXISTS ix_user_sessions_last_active_at ON user_sessions (last_active_at)")

    op.execute("CREATE INDEX IF NOT EXISTS ix_agents_organization_id ON agents (organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_agents_name ON agents (name)")

    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_agent_id ON reports (agent_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_reports_created_at_desc ON reports (created_at DESC)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_reports_created_at_desc")
    op.execute("DROP INDEX IF EXISTS ix_reports_agent_id")

    op.execute("DROP INDEX IF EXISTS ix_agents_name")
    op.execute("DROP INDEX IF EXISTS ix_agents_organization_id")

    op.execute("DROP INDEX IF EXISTS ix_user_sessions_last_active_at")

    op.execute("DROP INDEX IF EXISTS ix_analysis_results_composite_score")

    op.execute("DROP INDEX IF EXISTS ix_calls_created_at_desc")
    op.execute("DROP INDEX IF EXISTS ix_calls_uploaded_by")
    op.execute("DROP INDEX IF EXISTS ix_calls_status")
