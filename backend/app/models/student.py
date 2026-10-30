import uuid
from datetime import date, datetime
from typing import Any, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudentEnrolment(Base):
    __tablename__ = "student_enrolments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # 12-digit APAAR ID (nullable for provisional records)
    apaar_id: Mapped[Optional[str]] = mapped_column(
        String(12), index=True, nullable=True
    )
    # Unique provisional token e.g. PROV-APN-XXXX
    provisional_token: Mapped[Optional[str]] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )
    # Institutional Roll Number / Student ID (AICTE Req 10)
    institutional_student_id: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    program_quota_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("program_quotas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phonetic_name_code: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    seat_category: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    passport_or_oci_number: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    bank_account_hash: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )
    pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    parent_initials: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    validation_status: Mapped[str] = mapped_column(
        String(32), default="UNVERIFIED_PENDING_REGISTRY", nullable=False, index=True
    )
    # JSONB list of rule codes and plain-English explanations
    flag_reasons: Mapped[List[Any]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    institution: Mapped["Institution"] = relationship(
        "Institution", back_populates="students"
    )
    program_quota: Mapped["ProgramQuota"] = relationship(
        "ProgramQuota", back_populates="students"
    )

    __table_args__ = (
        Index("ix_student_inst_roll", "institution_id", "institutional_student_id"),
        Index("ix_student_apaar_quota", "apaar_id", "program_quota_id"),
    )
