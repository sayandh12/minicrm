"""create_activities_table

Revision ID: 0006_activities
Revises: 0005_leave_requests
Create Date: 2026-04-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_activities'
down_revision: Union[str, Sequence[str], None] = '0005_leave_requests'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the activities table (depends on leads, customers, and users)."""
    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'type',
            sa.Enum(
                'CALL', 'EMAIL', 'MEETING',
                'NOTE', 'STATUS_CHANGE', 'CONVERTED', 'FOLLOW_UP',
                name='activitytype'
            ),
            nullable=False,
        ),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        # Can be linked to a lead OR a customer (CRM history)
        sa.Column('lead_id', sa.Integer(), nullable=True),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        # Who performed the activity
        sa.Column('performed_by', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id']),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activities_customer_id'), 'activities', ['customer_id'], unique=False)
    op.create_index(op.f('ix_activities_id'), 'activities', ['id'], unique=False)
    op.create_index(op.f('ix_activities_lead_id'), 'activities', ['lead_id'], unique=False)


def downgrade() -> None:
    """Drop the activities table."""
    op.drop_index(op.f('ix_activities_lead_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_id'), table_name='activities')
    op.drop_index(op.f('ix_activities_customer_id'), table_name='activities')
    op.drop_table('activities')
    op.execute("DROP TYPE IF EXISTS activitytype")
