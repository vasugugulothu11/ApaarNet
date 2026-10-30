import uuid
from typing import List, Optional
from datetime import datetime

from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    aicte_permanent_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    aishe_code: Mapped[Optional[str]] = mapped_column(
        String(64), index=True, nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    institution_type: Mapped[str] = mapped_column(String(50), nullable=False)
    official_email_domain: Mapped[str] = mapped_column(String(128), nullable=False)
    compliance_risk_score: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    program_quotas: Mapped[List["ProgramQuota"]] = relationship(
        "ProgramQuota", back_populates="institution", cascade="all, delete-orphan"
    )
    students: Mapped[List["StudentEnrolment"]] = relationship(
        "StudentEnrolment", back_populates="institution"
    )


class ProgramQuota(Base):
    __tablename__ = "program_quotas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    program_name: Mapped[str] = mapped_column(String(150), nullable=False)
    course_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    delivery_mode: Mapped[str] = mapped_column(
        String(32), default="REGULAR_PHYSICAL", nullable=False
    )
    approved_intake: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    nri_5pct_internal_cap: Mapped[int] = mapped_column(
        Integer, default=3, nullable=False
    )
    fn_oci_ciwgc_15pct_supernumerary_cap: Mapped[int] = mapped_column(
        Integer, default=9, nullable=False
    )
    tfw_5pct_supernumerary_cap: Mapped[int] = mapped_column(
        Integer, default=3, nullable=False
    )
    pmsss_supernumerary_cap: Mapped[int] = mapped_column(
        Integer, default=2, nullable=False
    )
    lateral_entry_2nd_yr_cap: Mapped[int] = mapped_column(
        Integer, default=6, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    institution: Mapped["Institution"] = relationship(
        "Institution", back_populates="program_quotas"
    )
    students: Mapped[List["StudentEnrolment"]] = relationship(
        "StudentEnrolment", back_populates="program_quota"
    )
