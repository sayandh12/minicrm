from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_sales, require_admin_or_manager
from app.models.user import User
from app.models.lead import LeadStatus, LeadSource
from app.crud.lead import crud_lead
from app.crud.customer import crud_activity
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadListResponse
from app.schemas.customer import ActivityCreate, ActivityResponse
from app.services.lead_service import create_lead, update_lead_status
from app.services.crm_service import convert_lead_to_customer
from app.schemas.customer import CustomerResponse

router = APIRouter()


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_new_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    if data.assigned_to_id:
        user = await db.get(User, data.assigned_to_id)
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
            
    lead = await create_lead(db, data, current_user)
    await db.commit()
    await db.refresh(lead, ["assigned_to"])
    resp = LeadResponse.model_validate(lead)
    if lead.assigned_to:
        resp.assigned_to_name = lead.assigned_to.full_name
    return resp


@router.get("", response_model=LeadListResponse)
async def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    assigned_to_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * size
    leads, total = await crud_lead.get_multi_filtered(
        db,
        skip=skip,
        limit=size,
        status=status,
        source=source,
        assigned_to_id=assigned_to_id,
        search=search,
    )
    items = []
    for lead in leads:
        r = LeadResponse.model_validate(lead)
        if lead.assigned_to:
            r.assigned_to_name = lead.assigned_to.full_name
        items.append(r)

    return LeadListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 1,
    )


@router.get("/follow-ups")
async def get_followups_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leads = await crud_lead.get_follow_ups_today(db)
    return [LeadResponse.model_validate(l) for l in leads]


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = await crud_lead.get_with_assignee(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    resp = LeadResponse.model_validate(lead)
    if lead.assigned_to:
        resp.assigned_to_name = lead.assigned_to.full_name
    return resp


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    lead = await crud_lead.get_with_assignee(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if data.assigned_to_id:
        user = await db.get(User, data.assigned_to_id)
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")

    # Handle status change via service for audit log
    if data.status and data.status != lead.status:
        lead = await update_lead_status(db, lead, data.status, current_user)
        data_dict = data.model_dump(exclude_unset=True, exclude={"status"})
    else:
        data_dict = data.model_dump(exclude_unset=True)

    if data_dict:
        lead = await crud_lead.update(db, db_obj=lead, obj_in=data_dict, updated_by=current_user.id)

    await db.commit()
    await db.refresh(lead, ["assigned_to"])
    
    resp = LeadResponse.model_validate(lead)
    if lead.assigned_to:
        resp.assigned_to_name = lead.assigned_to.full_name
    return resp


@router.post("/{lead_id}/assign", response_model=LeadResponse)
async def assign_lead(
    lead_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    lead = await crud_lead.get(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if user to assign exists
    user_to_assign = await db.get(User, user_id)
    if not user_to_assign:
        raise HTTPException(status_code=404, detail="User to assign not found")

    lead = await crud_lead.assign_lead(db, lead, user_id, current_user.id)
    await db.commit()
    return LeadResponse.model_validate(lead)


@router.post("/{lead_id}/convert", response_model=CustomerResponse)
async def convert_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    lead = await crud_lead.get_with_assignee(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    customer = await convert_lead_to_customer(db, lead, current_user)
    await db.commit()
    return CustomerResponse.model_validate(customer)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    lead = await crud_lead.get(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    await crud_lead.remove(db, id=lead_id)
    await db.commit()
    return {"message": "Lead deleted successfully"}


# Activity on lead
@router.post("/{lead_id}/activities", response_model=ActivityResponse)
async def add_lead_activity(
    lead_id: int,
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = await crud_lead.get(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    activity = await crud_activity.create(
        db,
        obj_in={**data.model_dump(), "lead_id": lead_id, "performed_by": current_user.id},
        created_by=current_user.id,
    )
    await db.commit()
    return ActivityResponse.model_validate(activity)


@router.get("/{lead_id}/activities", response_model=list[ActivityResponse])
async def get_lead_activities(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_activity.get_by_lead(db, lead_id)
