from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.lead import crud_lead
from app.crud.customer import crud_customer, crud_activity
from app.models.lead import Lead, LeadStatus
from app.models.customer import Customer
from app.models.activity import ActivityType
from app.models.user import User


async def convert_lead_to_customer(
    db: AsyncSession, lead: Lead, current_user: User
) -> Customer:
    """Atomically convert a qualified lead into a customer."""

    if lead.status == LeadStatus.CONVERTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead is already converted.",
        )
    # Check if a customer already exists for this lead
    existing_customer_result = await db.execute(select(Customer).where(Customer.lead_id == lead.id))
    if existing_customer_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This lead already has an associated customer.",
        )

    # Create customer from lead data
    customer = Customer(
        full_name=f"{lead.first_name} {lead.last_name}",
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        total_value=lead.estimated_value or 0.0,
        notes=lead.notes,
        lead_id=lead.id,
        created_by=current_user.id,
    )
    db.add(customer)
    await db.flush()

    # Update lead status to CONVERTED
    lead.status = LeadStatus.CONVERTED
    lead.updated_by = current_user.id
    db.add(lead)

    # Log conversion activity on both
    for log in [
        {"lead_id": lead.id, "customer_id": None},
        {"lead_id": None, "customer_id": customer.id},
    ]:
        await crud_activity.create(
            db,
            obj_in={
                "type": ActivityType.CONVERTED,
                "subject": "Lead Converted to Customer",
                "description": f"Lead '{lead.title}' was successfully converted to customer.",
                **log,
            },
            created_by=current_user.id,
        )

    await db.flush()
    await db.refresh(customer)
    return customer
