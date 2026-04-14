from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.employee import Employee, EmployeeStatus, EmploymentType
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.schemas.leave import LeaveRequestCreate, LeaveRequestUpdate


class CRUDEmployee(CRUDBase[Employee, EmployeeCreate, EmployeeUpdate]):

    async def get_with_user(self, db: AsyncSession, employee_id: int) -> Optional[Employee]:
        result = await db.execute(
            select(Employee)
            .options(selectinload(Employee.user))
            .where(Employee.id == employee_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, db: AsyncSession, user_id: int) -> Optional[Employee]:
        result = await db.execute(
            select(Employee)
            .options(selectinload(Employee.user))
            .where(Employee.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        department: Optional[str] = None,
        status: Optional[EmployeeStatus] = None,
        employment_type: Optional[EmploymentType] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Employee], int]:
        query = select(Employee).options(selectinload(Employee.user))
        count_query = select(func.count()).select_from(Employee)

        filters = []
        if department:
            filters.append(Employee.department == department)
        if status:
            filters.append(Employee.status == status)
        if employment_type:
            filters.append(Employee.employment_type == employment_type)
        if search:
            term = f"%{search}%"
            filters.append(
                or_(
                    Employee.employee_code.ilike(term),
                    Employee.department.ilike(term),
                    Employee.designation.ilike(term),
                )
            )

        from sqlalchemy import and_
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await db.execute(count_query)).scalar_one()
        result = await db.execute(query.offset(skip).limit(limit).order_by(Employee.created_at.desc()))
        return result.scalars().all(), total

    async def get_next_employee_code(self, db: AsyncSession) -> str:
        result = await db.execute(select(func.count()).select_from(Employee))
        count = result.scalar_one()
        return f"EMP{str(count + 1).zfill(4)}"


class CRUDLeave(CRUDBase[LeaveRequest, LeaveRequestCreate, LeaveRequestUpdate]):
    async def get_with_employee(self, db: AsyncSession, leave_id: int) -> Optional[LeaveRequest]:
        result = await db.execute(
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.employee).selectinload(Employee.user))
            .where(LeaveRequest.id == leave_id)
        )
        return result.scalar_one_or_none()

    async def get_by_employee(self, db: AsyncSession, employee_id: int) -> List[LeaveRequest]:
        result = await db.execute(
            select(LeaveRequest)
            .where(LeaveRequest.employee_id == employee_id)
            .order_by(LeaveRequest.created_at.desc())
        )
        return result.scalars().all()

    async def get_pending(self, db: AsyncSession) -> List[LeaveRequest]:
        result = await db.execute(
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.employee).selectinload(Employee.user))
            .where(LeaveRequest.status == LeaveStatus.PENDING)
            .order_by(LeaveRequest.created_at.asc())
        )
        return result.scalars().all()

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 20,
        employee_id: Optional[int] = None,
        status: Optional[LeaveStatus] = None,
    ) -> Tuple[List[LeaveRequest], int]:
        query = select(LeaveRequest).options(
            selectinload(LeaveRequest.employee).selectinload(Employee.user)
        )
        count_query = select(func.count()).select_from(LeaveRequest)

        filters = []
        if employee_id:
            filters.append(LeaveRequest.employee_id == employee_id)
        if status:
            filters.append(LeaveRequest.status == status)

        from sqlalchemy import and_
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await db.execute(count_query)).scalar_one()
        result = await db.execute(query.offset(skip).limit(limit).order_by(LeaveRequest.created_at.desc()))
        return result.scalars().all(), total


crud_employee = CRUDEmployee(Employee)
crud_leave = CRUDLeave(LeaveRequest)
