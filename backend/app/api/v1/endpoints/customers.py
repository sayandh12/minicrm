from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_sales, require_admin_or_manager
from app.models.user import User
from app.crud.customer import crud_customer, crud_activity
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, ActivityCreate, ActivityResponse

router = APIRouter()


@router.get("", response_model=dict)
async def list_customers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * size
    customers, total = await crud_customer.get_multi_filtered(db, skip=skip, limit=size, search=search)
    return {
        "items": [CustomerResponse.model_validate(c) for c in customers],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    customer = await crud_customer.create(db, obj_in=data, created_by=current_user.id)
    await db.commit()
    await db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_sales),
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = await crud_customer.update(db, db_obj=customer, obj_in=data, updated_by=current_user.id)
    await db.commit()
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_manager),
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await crud_customer.remove(db, id=customer_id)
    await db.commit()
    return {"message": "Customer deleted successfully"}


@router.post("/{customer_id}/activities", response_model=ActivityResponse)
async def add_customer_activity(
    customer_id: int,
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = await crud_customer.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    activity = await crud_activity.create(
        db,
        obj_in={**data.model_dump(), "customer_id": customer_id, "performed_by": current_user.id},
        created_by=current_user.id,
    )
    await db.commit()
    return ActivityResponse.model_validate(activity)


@router.get("/{customer_id}/activities", response_model=list[ActivityResponse])
async def get_customer_activities(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = await crud_activity.get_by_customer(db, customer_id)
    result = []
    for a in activities:
        r = ActivityResponse.model_validate(a)
        if a.performed_by_user:
            r.performed_by_name = a.performed_by_user.full_name
        result.append(r)
    return result
