"""create_leave_requests_table

Revision ID: 0005_leave_requests
Revises: 0004_customers
Create Date: 2026-04-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_leave_requests'
down_revision: Union[str, Sequence[str], None] = '0004_customers'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the leave_requests table (depends on employees and users)."""
    op.create_table(
        'leave_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'leave_type',
            sa.Enum(
                'ANNUAL', 'SICK', 'CASUAL',
                'MATERNITY', 'PATERNITY', 'UNPAID',
                name='leavetype'
            ),
            nullable=False,
        ),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('days_count', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED',
                name='leavestatus'
            ),
            nullable=False,
        ),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_leave_requests_employee_id'), 'leave_requests', ['employee_id'], unique=False)
    op.create_index(op.f('ix_leave_requests_id'), 'leave_requests', ['id'], unique=False)
    op.create_index(op.f('ix_leave_requests_status'), 'leave_requests', ['status'], unique=False)


def downgrade() -> None:
    """Drop the leave_requests table."""
    op.drop_index(op.f('ix_leave_requests_status'), table_name='leave_requests')
    op.drop_index(op.f('ix_leave_requests_id'), table_name='leave_requests')
    op.drop_index(op.f('ix_leave_requests_employee_id'), table_name='leave_requests')
    op.drop_table('leave_requests')
    op.execute("DROP TYPE IF EXISTS leavestatus")
    op.execute("DROP TYPE IF EXISTS leavetype")
