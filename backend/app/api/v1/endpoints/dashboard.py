from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.lead import Lead, LeadStatus
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveStatus
from app.crud.customer import crud_activity
from app.crud.lead import crud_lead

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Lead counts by status
    lead_counts = {}
    for s in LeadStatus:
        result = await db.execute(select(func.count()).select_from(Lead).where(Lead.status == s))
        lead_counts[s.value] = result.scalar_one()

    # Total customers
    total_customers = (await db.execute(select(func.count()).select_from(Customer))).scalar_one()

    # Total employees
    total_employees = (await db.execute(select(func.count()).select_from(Employee))).scalar_one()

    # Pending leaves
    pending_leaves = (
        await db.execute(
            select(func.count()).select_from(LeaveRequest).where(LeaveRequest.status == LeaveStatus.PENDING)
        )
    ).scalar_one()

    # Total lead value in pipeline (not converted/lost)
    pipeline_value_result = await db.execute(
        select(func.coalesce(func.sum(Lead.estimated_value), 0)).where(
            Lead.status.not_in([LeadStatus.CONVERTED, LeadStatus.LOST])
        )
    )
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
