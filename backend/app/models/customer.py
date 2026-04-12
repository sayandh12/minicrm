from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, AuditMixin


class Customer(Base, AuditMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # FK: lead that was converted
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id"), nullable=True, unique=True)

    # Relationships
    lead = relationship("Lead", back_populates="customer")
    activities = relationship("Activity", back_populates="customer", cascade="all, delete-orphan")
