from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus
from app.crud.customer import crud_activity
from app.crud.lead import crud_lead
from app.crud.employee import crud_employee

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_manager = current_user.role in (UserRole.ADMIN, UserRole.HR_EXECUTIVE)

    # Lead counts by status (Filtered by role if needed)
    lead_counts = {}
    for s in LeadStatus:
        query = select(func.count()).select_from(Lead).where(Lead.status == s)
        if not is_manager:
            query = query.where(Lead.assigned_to_id == current_user.id)
        result = await db.execute(query)
        lead_counts[s.value] = result.scalar_one()

    # Total customers (Managers see all, others see own?) 
    # For now, let's keep customers global but leads filtered
    total_customers = (await db.execute(select(func.count()).select_from(Customer))).scalar_one()

    # Total employees (Only managers see total headcount)
    total_employees = (await db.execute(select(func.count()).select_from(Employee))).scalar_one() if is_manager else 0

    # Pending leaves (Managers see all, Employees see OWN)
    pending_leaves = 0
    if is_manager:
        result = await db.execute(
            select(func.count()).select_from(LeaveRequest).where(LeaveRequest.status == LeaveStatus.PENDING)
        )
        pending_leaves = result.scalar_one()
    else:
        employee = await crud_employee.get_by_user_id(db, current_user.id)
        if employee:
            result = await db.execute(
                select(func.count()).select_from(LeaveRequest).where(
                    LeaveRequest.employee_id == employee.id,
                    LeaveRequest.status == LeaveStatus.PENDING
                )
            )
            pending_leaves = result.scalar_one()

    # Total lead value in pipeline (Role filtered)
    val_query = select(func.coalesce(func.sum(Lead.estimated_value), 0)).where(
        Lead.status.not_in([LeadStatus.CONVERTED, LeadStatus.LOST])
    )
    if not is_manager:
        val_query = val_query.where(Lead.assigned_to_id == current_user.id)
        
    pipeline_value_result = await db.execute(val_query)
    pipeline_value = float(pipeline_value_result.scalar_one())

    # Recent activities
    recent_activities = await crud_activity.get_recent(db, limit=8)
    activities_data = []
    for a in recent_activities:
        activities_data.append({
            "id": a.id,
            "type": a.type,
            "subject": a.subject,
            "lead_id": a.lead_id,
            "lead_title": a.lead.title if a.lead else None,
            "customer_id": a.customer_id,
            "customer_name": a.customer.full_name if a.customer else None,
            "performed_by": a.performed_by_user.full_name if a.performed_by_user else None,
            "created_at": a.created_at.isoformat(),
        })

    # Follow-ups due today
    follow_ups = await crud_lead.get_follow_ups_today(db)
    follow_up_data = [
        {
            "id": l.id,
            "title": l.title,
            "status": l.status.value,
            "assigned_to": l.assigned_to.full_name if l.assigned_to else None,
        }
        for l in follow_ups
    ]

    return {
        "leads": {
            "total": sum(lead_counts.values()),
            "by_status": lead_counts,
        },
        "customers": {"total": total_customers},
        "employees": {"total": total_employees},
        "leaves": {"pending": pending_leaves},
        "pipeline_value": pipeline_value,
        "recent_activities": activities_data,
        "follow_ups_today": follow_up_data,
    }
