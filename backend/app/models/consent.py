import uuid
from datetime import datetime
from typing import Any, List

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    apaar_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    requester_name: Mapped[str] = mapped_column(String(150), nullable=False)
    requester_role: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    approved_fields: Mapped[List[Any]] = mapped_column(
        JSONB, default=list, nullable=False
    )
    disclosure_mode: Mapped[str] = mapped_column(
        String(32), nullable=False, default="ZERO_EXPOSURE_PREDICATE"
    )
    passkey_or_otp_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
