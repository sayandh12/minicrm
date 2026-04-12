from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.customer import Customer
from app.models.activity import Activity
from app.schemas.customer import CustomerCreate, CustomerUpdate, ActivityCreate, ActivityResponse


class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[List[Customer], int]:
        query = select(Customer)
        count_query = select(func.count()).select_from(Customer)

        if search:
            term = f"%{search}%"
            filt = or_(
                Customer.full_name.ilike(term),
                Customer.email.ilike(term),
                Customer.company.ilike(term),
            )
            query = query.where(filt)
            count_query = count_query.where(filt)

        total = (await db.execute(count_query)).scalar_one()
        result = await db.execute(query.offset(skip).limit(limit).order_by(Customer.created_at.desc()))
        return result.scalars().all(), total


class CRUDActivity(CRUDBase[Activity, ActivityCreate, ActivityCreate]):

    async def get_by_lead(self, db: AsyncSession, lead_id: int) -> List[Activity]:
        result = await db.execute(
            select(Activity)
            .options(selectinload(Activity.performed_by_user))
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_customer(self, db: AsyncSession, customer_id: int) -> List[Activity]:
        result = await db.execute(
            select(Activity)
            .options(selectinload(Activity.performed_by_user))
            .where(Activity.customer_id == customer_id)
            .order_by(Activity.created_at.desc())
        )
        return result.scalars().all()

    async def get_recent(self, db: AsyncSession, limit: int = 10) -> List[Activity]:
        result = await db.execute(
            select(Activity)
            .options(
                selectinload(Activity.performed_by_user),
                selectinload(Activity.lead),
                selectinload(Activity.customer),
            )
            .order_by(Activity.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


crud_customer = CRUDCustomer(Customer)
crud_activity = CRUDActivity(Activity)
