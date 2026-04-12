from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.models.lead import LeadStatus, LeadSource


class LeadCreate(BaseModel):
    title: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: LeadSource = LeadSource.OTHER
    status: LeadStatus = LeadStatus.NEW
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    estimated_value: Optional[float] = None
    assigned_to_id: Optional[int] = None


class LeadUpdate(BaseModel):
    title: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    estimated_value: Optional[float] = None
    assigned_to_id: Optional[int] = None


class LeadResponse(BaseModel):
    id: int
    title: str
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    source: LeadSource
    status: LeadStatus
    notes: Optional[str]
    follow_up_date: Optional[date]
    estimated_value: Optional[float]
    assigned_to_id: Optional[int]
    assigned_to_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    size: int
    pages: int
