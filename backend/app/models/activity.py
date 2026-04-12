import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, AuditMixin


class ActivityType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    STATUS_CHANGE = "status_change"
    CONVERTED = "converted"
    FOLLOW_UP = "follow_up"


class Activity(Base, AuditMixin):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[ActivityType] = mapped_column(SAEnum(ActivityType), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Can be linked to a lead OR a customer
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id"), nullable=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)

    # Who performed the activity
    performed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="activities")
    customer = relationship("Customer", back_populates="activities")
    performed_by_user = relationship("User", back_populates="activities", foreign_keys=[performed_by])
