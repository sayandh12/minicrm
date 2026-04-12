from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadUpdate


class CRUDLead(CRUDBase[Lead, LeadCreate, LeadUpdate]):

    async def get_with_assignee(self, db: AsyncSession, lead_id: int) -> Optional[Lead]:
        result = await db.execute(
            select(Lead)
            .options(selectinload(Lead.assigned_to))
            .where(Lead.id == lead_id)
        )
        return result.scalar_one_or_none()

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        status: Optional[LeadStatus] = None,
        source: Optional[LeadSource] = None,
        assigned_to_id: Optional[int] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Lead], int]:
        query = select(Lead).options(selectinload(Lead.assigned_to))
        count_query = select(func.count()).select_from(Lead)

        filters = []
        if status:
            filters.append(Lead.status == status)
        if source:
            filters.append(Lead.source == source)
        if assigned_to_id:
            filters.append(Lead.assigned_to_id == assigned_to_id)
        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    Lead.first_name.ilike(term),
                    Lead.last_name.ilike(term),
                    Lead.email.ilike(term),
                    Lead.company.ilike(term),
                    Lead.title.ilike(term),
                )
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        result = await db.execute(query.offset(skip).limit(limit).order_by(Lead.created_at.desc()))
        return result.scalars().all(), total

    async def get_follow_ups_today(self, db: AsyncSession) -> List[Lead]:
        from datetime import date
        result = await db.execute(
            select(Lead)
            .options(selectinload(Lead.assigned_to))
            .where(Lead.follow_up_date == date.today())
            .where(Lead.status.not_in([LeadStatus.CONVERTED, LeadStatus.LOST]))
        )
        return result.scalars().all()

    async def assign_lead(self, db: AsyncSession, lead: Lead, user_id: int, updated_by: int) -> Lead:
        lead.assigned_to_id = user_id
        lead.updated_by = updated_by
        db.add(lead)
        await db.flush()
        await db.refresh(lead)
        return lead


crud_lead = CRUDLead(Lead)
