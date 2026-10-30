from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import BigInteger, DateTime, Identity, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MerkleAuditLog(Base):
    __tablename__ = "merkle_audit_log"

    seq_id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, increment=1),
        primary_key=True,
        autoincrement=True,
    )
    actor_role: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    prev_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    record_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    checkpoint_signature: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
