from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_hr
from app.models.user import User
from app.models.leave import LeaveStatus
from app.crud.employee import crud_leave, crud_employee
from app.schemas.leave import LeaveRequestCreate, LeaveRequestUpdate, LeaveResponse
from app.services.hrm_service import submit_leave_request, review_leave_request

router = APIRouter()


@router.post("", response_model=LeaveResponse)
async def apply_leave(
    data: LeaveRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = await submit_leave_request(db, data, current_user)
    await db.commit()
    resp = LeaveResponse.model_validate(leave)
    if leave.employee and leave.employee.user:
        resp.employee_name = leave.employee.user.full_name
    return resp


@router.get("", response_model=dict)
async def list_leaves(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    employee_id: Optional[int] = None,
    status: Optional[LeaveStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    skip = (page - 1) * size
    leaves, total = await crud_leave.get_multi_filtered(
        db, skip=skip, limit=size, employee_id=employee_id, status=status
    )
    import math
    items = []
    for leave in leaves:
        r = LeaveResponse.model_validate(leave)
        if leave.employee and leave.employee.user:
            r.employee_name = leave.employee.user.full_name
        items.append(r)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total else 1,
    }


@router.get("/my-leaves", response_model=list[LeaveResponse])
async def my_leave_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await crud_employee.get_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(status_code=404, detail="No employee profile found")
    leaves = await crud_leave.get_by_employee(db, employee.id)
    result = []
    for l in leaves:
        r = LeaveResponse.model_validate(l)
        r.employee_name = current_user.full_name
        result.append(r)
    return result


@router.get("/pending", response_model=list[LeaveResponse])
async def get_pending_leaves(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    leaves = await crud_leave.get_pending(db)
    items = []
    for leave in leaves:
        r = LeaveResponse.model_validate(leave)
        if leave.employee and leave.employee.user:
            r.employee_name = leave.employee.user.full_name
        items.append(r)
    return items


@router.get("/{leave_id}", response_model=LeaveResponse)
async def get_leave(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = await crud_leave.get_with_employee(db, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    resp = LeaveResponse.model_validate(leave)
    if leave.employee and leave.employee.user:
        resp.employee_name = leave.employee.user.full_name
    return resp


@router.patch("/{leave_id}/review", response_model=LeaveResponse)
async def review_leave(
    leave_id: int,
    data: LeaveRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hr),
):
    leave = await crud_leave.get_with_employee(db, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave = await review_leave_request(db, leave, data.status, data.rejection_reason, current_user)
    await db.commit()
    resp = LeaveResponse.model_validate(leave)
    if leave.employee and leave.employee.user:
        resp.employee_name = leave.employee.user.full_name
    return resp


@router.delete("/{leave_id}")
async def cancel_leave(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    leave = await crud_leave.get(db, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    employee = await crud_employee.get_by_user_id(db, current_user.id)
    if not employee or leave.employee_id != employee.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own leave requests")
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending leave requests can be cancelled")

    leave.status = LeaveStatus.CANCELLED
    await db.commit()
    return {"message": "Leave request cancelled successfully"}
