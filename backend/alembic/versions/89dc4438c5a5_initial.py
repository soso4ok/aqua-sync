"""initial

Revision ID: 89dc4438c5a5
Revises:
Create Date: 2026-04-25 08:20:58.482586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql

revision: str = '89dc4438c5a5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('anomaly_polygons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
        sa.Column('ndwi_max', sa.Float(), nullable=True),
        sa.Column('chlorophyll_a', sa.Float(), nullable=True),
        sa.Column('cyanobacteria', sa.Float(), nullable=True),
        sa.Column('turbidity', sa.Float(), nullable=True),
        sa.Column('sentinel_scene_id', sa.String(length=128), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('scene_date', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('background_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_type', sa.String(length=64), nullable=False),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', name='taskstatus'), nullable=False),
        sa.Column('error_log', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_background_tasks_status'), 'background_tasks', ['status'], unique=False)
    op.create_index(op.f('ix_background_tasks_task_type'), 'background_tasks', ['task_type'], unique=False)
    op.create_table('rate_limits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False),
        sa.Column('next_allowed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('backoff_seconds', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rate_limits_key'), 'rate_limits', ['key'], unique=True)
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('citizen_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
        sa.Column('gnss_accuracy_m', sa.Float(), nullable=True),
        sa.Column('photo_url', sa.String(length=512), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('pollution_type', sa.Enum('OIL_SLICK', 'ALGAL_BLOOM', 'FOAM', 'DISCOLORATION', 'DEBRIS', 'UNKNOWN', name='pollutiontype'), nullable=False),
        sa.Column('trust_level', sa.Enum('HIGH', 'LOW', 'EVIDENCE_VOID', 'PENDING', name='trustlevel'), nullable=False),
        sa.Column('ai_verdict', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('captured_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('anomaly_id', sa.Integer(), nullable=False),
        sa.Column('severity', sa.Enum('HIGH', 'MEDIUM', 'LOW', name='alertseverity'), nullable=False),
        sa.Column('status', sa.Enum('OPEN', 'ACKNOWLEDGED', 'RESOLVED', name='alertstatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['anomaly_id'], ['anomaly_polygons.id'], ),
        sa.ForeignKeyConstraint(['report_id'], ['citizen_reports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('alerts')
    op.drop_table('citizen_reports')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_rate_limits_key'), table_name='rate_limits')
    op.drop_table('rate_limits')
    op.drop_index(op.f('ix_background_tasks_task_type'), table_name='background_tasks')
    op.drop_index(op.f('ix_background_tasks_status'), table_name='background_tasks')
    op.drop_table('background_tasks')
    op.drop_table('anomaly_polygons')
    op.execute("DROP TYPE IF EXISTS alertstatus")
    op.execute("DROP TYPE IF EXISTS alertseverity")
    op.execute("DROP TYPE IF EXISTS trustlevel")
    op.execute("DROP TYPE IF EXISTS pollutiontype")
    op.execute("DROP TYPE IF EXISTS taskstatus")
