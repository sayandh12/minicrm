from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_hr, require_admin
from app.models.user import User
from app.models.employee import EmployeeStatus
from app.crud.employee import crud_employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter()


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    # Check for duplicate user_id
    existing = await crud_employee.get_by_user_id(db, data.user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Employee profile already exists for this user")

    from sqlalchemy.exc import IntegrityError
    try:
        employee = await crud_employee.create(db, obj_in=data, created_by=current_user.id)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Employee code already exists or user is already linked to another profile"
        )

    await db.refresh(employee, ["user"])

    resp = EmployeeResponse.model_validate(employee)
    if employee.user:
        resp.user_name = employee.user.full_name
        resp.user_email = employee.user.email
    return resp


@router.get("", response_model=dict)
async def list_employees(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    department: Optional[str] = None,
    status: Optional[EmployeeStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    skip = (page - 1) * size
    employees, total = await crud_employee.get_multi_filtered(
        db, skip=skip, limit=size, department=department, status=status, search=search
    )
    items = []
    for emp in employees:
        r = EmployeeResponse.model_validate(emp)
        if emp.user:
            r.user_name = emp.user.full_name
            r.user_email = emp.user.email
        items.append(r)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await crud_employee.get_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(status_code=404, detail="No employee profile found")
    resp = EmployeeResponse.model_validate(employee)
    resp.user_name = current_user.full_name
    resp.user_email = current_user.email
    return resp


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    employee = await crud_employee.get_with_user(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    resp = EmployeeResponse.model_validate(employee)
    if employee.user:
        resp.user_name = employee.user.full_name
        resp.user_email = employee.user.email
    return resp


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    employee = await crud_employee.get_with_user(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee = await crud_employee.update(db, db_obj=employee, obj_in=data, updated_by=current_user.id)
    await db.commit()
    await db.refresh(employee, ["user"])
    resp = EmployeeResponse.model_validate(employee)
    if employee.user:
        resp.user_name = employee.user.full_name
        resp.user_email = employee.user.email
    return resp


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    employee = await crud_employee.get(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    await crud_employee.remove(db, id=employee_id)
    await db.commit()
    return {"message": "Employee profile deleted successfully"}
