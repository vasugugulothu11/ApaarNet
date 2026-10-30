import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DisputeTicket(Base):
    __tablename__ = "dispute_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    student_apaar_or_token: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    college_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    college_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    collision_type: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(32), default="OPEN_TRI_PARTY", nullable=False, index=True
    )
    evidence_log: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, default=dict, nullable=False
    )
    officer_decision_reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    college_a: Mapped["Institution"] = relationship(
        "Institution", foreign_keys=[college_a_id]
    )
    college_b: Mapped["Institution"] = relationship(
        "Institution", foreign_keys=[college_b_id]
    )
