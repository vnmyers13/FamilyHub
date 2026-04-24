# PURPOSE: Initial database schema migration for FamilyHub
# ROLE: Backend Database
# MODIFIED: 2026-04-24 — Phase 1.1 setup

"""Initial schema with families, users, and sessions tables.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-04-24 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create families table
    op.create_table(
        'families',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('timezone', sa.String(50), nullable=True, server_default='UTC'),
        sa.Column('settings_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('family_id', sa.String(36), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('email', sa.String(255), nullable=True, unique=True),
        sa.Column('role', sa.String(20), nullable=False, server_default='member'),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('ui_mode', sa.String(10), nullable=True, server_default='light'),
        sa.Column('pin_hash', sa.String(255), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['family_id'], ['families.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_users_email')
    )

    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False),
        sa.Column('device_hint', sa.String(255), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for common queries
    op.create_index('ix_users_family_id', 'users', ['family_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
    op.create_index('ix_sessions_expires_at', 'sessions', ['expires_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_sessions_expires_at')
    op.drop_index('ix_sessions_user_id')
    op.drop_index('ix_users_email')
    op.drop_index('ix_users_family_id')

    # Drop tables
    op.drop_table('sessions')
    op.drop_table('users')
    op.drop_table('families')
