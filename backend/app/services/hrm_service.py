from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.employee import crud_leave, crud_employee
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import User, UserRole
from app.schemas.leave import LeaveRequestCreate


async def submit_leave_request(
    db: AsyncSession, data: LeaveRequestCreate, current_user: User
) -> LeaveRequest:
    """Employee submits a leave request (must have an employee profile)."""
    employee = await crud_employee.get_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee profile found for current user.",
        )

    days = (data.end_date - data.start_date).days + 1
    leave = LeaveRequest(
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        days_count=days,
        reason=data.reason,
        status=LeaveStatus.PENDING,
        employee_id=employee.id,
        created_by=current_user.id,
    )
    db.add(leave)
    await db.flush()
    await db.refresh(leave, ["employee"])
    await db.refresh(leave.employee, ["user"])
    return leave


async def review_leave_request(
    db: AsyncSession,
    leave: LeaveRequest,
    new_status: LeaveStatus,
    rejection_reason: str | None,
    current_user: User,
) -> LeaveRequest:
    """HR Executive or Admin approves / rejects a leave request."""
    if current_user.role not in (UserRole.ADMIN, UserRole.HR_EXECUTIVE):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave is already '{leave.status.value}' and cannot be reviewed again.",
        )

    if new_status == LeaveStatus.REJECTED and not rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rejection reason is required when rejecting a leave request.",
        )

    leave.status = new_status
    leave.reviewed_by = current_user.id
    leave.updated_by = current_user.id
    if rejection_reason:
        leave.rejection_reason = rejection_reason

    db.add(leave)
    await db.flush()
    await db.refresh(leave, ["employee"])
    await db.refresh(leave.employee, ["user"])
    return leave
