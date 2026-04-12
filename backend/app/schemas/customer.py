from pydantic import BaseModel
from typing import Optional
from app.models.activity import ActivityType


class CustomerCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    total_value: Optional[float] = None


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    address: Optional[str]
    total_value: float
    notes: Optional[str]
    lead_id: Optional[int]

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None


class ActivityResponse(BaseModel):
    id: int
    type: ActivityType
    subject: str
    description: Optional[str]
    lead_id: Optional[int]
    customer_id: Optional[int]
    performed_by: Optional[int]
    performed_by_name: Optional[str] = None

    model_config = {"from_attributes": True}
