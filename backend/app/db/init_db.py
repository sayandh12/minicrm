from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


async def init_db(db: AsyncSession) -> None:
    """Seed the first admin user if not exists."""
    result = await db.execute(
        select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
    )
    existing = result.scalar_one_or_none()

    if not existing:
        admin = User(
            email=settings.FIRST_ADMIN_EMAIL,
            full_name=settings.FIRST_ADMIN_FULL_NAME,
            hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        logger.info(f"Admin user created: {settings.FIRST_ADMIN_EMAIL}")
    else:
        logger.info("Admin user already exists, skipping seed.")
