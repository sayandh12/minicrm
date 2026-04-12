from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.lead import crud_lead
from app.crud.customer import crud_activity
from app.models.lead import Lead, LeadStatus
from app.models.activity import ActivityType
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadUpdate


async def create_lead(db: AsyncSession, data: LeadCreate, current_user: User) -> Lead:
    lead = await crud_lead.create(db, obj_in=data, created_by=current_user.id)
    # Log activity
    await crud_activity.create(
        db,
        obj_in={
            "type": ActivityType.NOTE,
            "subject": "Lead Created",
            "description": f"Lead '{lead.title}' was created.",
            "lead_id": lead.id,
        },
        created_by=current_user.id,
    )
    return lead


async def update_lead_status(
    db: AsyncSession, lead: Lead, new_status: LeadStatus, current_user: User
) -> Lead:
    old_status = lead.status
    if old_status == new_status:
        return lead

    if old_status == LeadStatus.CONVERTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change status of a converted lead.",
        )

    lead = await crud_lead.update(
        db,
        db_obj=lead,
        obj_in={"status": new_status},
        updated_by=current_user.id,
    )
    await crud_activity.create(
        db,
        obj_in={
            "type": ActivityType.STATUS_CHANGE,
            "subject": "Status Changed",
            "description": f"Status changed from '{old_status.value}' to '{new_status.value}'.",
            "lead_id": lead.id,
        },
        created_by=current_user.id,
    )
    return lead
