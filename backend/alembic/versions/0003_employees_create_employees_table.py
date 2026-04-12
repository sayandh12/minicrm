"""create_employees_table

Revision ID: 0003_employees
Revises: 0002_leads
Create Date: 2026-04-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_employees'
down_revision: Union[str, Sequence[str], None] = '0002_leads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the employees table (depends on users)."""
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_code', sa.String(length=20), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('designation', sa.String(length=100), nullable=False),
        sa.Column('date_of_joining', sa.Date(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('salary', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            'employment_type',
            sa.Enum(
                'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN',
                name='employmenttype'
            ),
            nullable=False,
        ),
        sa.Column(
            'status',
            sa.Enum(
                'ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED',
                name='employeestatus'
            ),
            nullable=False,
        ),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('emergency_contact', sa.String(length=255), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        # Audit fields
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_employees_employee_code'), 'employees', ['employee_code'], unique=True)
    op.create_index(op.f('ix_employees_id'), 'employees', ['id'], unique=False)
    op.create_index(op.f('ix_employees_status'), 'employees', ['status'], unique=False)


def downgrade() -> None:
    """Drop the employees table."""
    op.drop_index(op.f('ix_employees_status'), table_name='employees')
    op.drop_index(op.f('ix_employees_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_employee_code'), table_name='employees')
    op.drop_table('employees')
    op.execute("DROP TYPE IF EXISTS employeestatus")
    op.execute("DROP TYPE IF EXISTS employmenttype")
