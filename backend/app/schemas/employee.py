from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.employee import EmploymentType, EmployeeStatus


class EmployeeCreate(BaseModel):
    user_id: int
    employee_code: str
    department: str
    designation: str
    date_of_joining: date
    date_of_birth: Optional[date] = None
    salary: Optional[float] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    address: Optional[str] = None
    emergency_contact: Optional[str] = None


class EmployeeUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    salary: Optional[float] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[EmployeeStatus] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    department: str
    designation: str
    date_of_joining: date
    date_of_birth: Optional[date]
    salary: Optional[float]
    employment_type: EmploymentType
    status: EmployeeStatus
    address: Optional[str]
    emergency_contact: Optional[str]
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
