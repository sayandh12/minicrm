from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import date
from app.models.leave import LeaveType, LeaveStatus


class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be after start_date")
        self.days_count = (self.end_date - self.start_date).days + 1
        return self

    days_count: Optional[int] = None


class LeaveRequestUpdate(BaseModel):
    status: LeaveStatus
    rejection_reason: Optional[str] = None


class LeaveResponse(BaseModel):
    id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_count: int
    reason: str
    status: LeaveStatus
    rejection_reason: Optional[str]
    employee_id: int
    employee_name: Optional[str] = None
    reviewed_by: Optional[int]

    model_config = {"from_attributes": True}
