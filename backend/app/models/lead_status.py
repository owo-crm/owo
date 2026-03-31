import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class LeadStatus(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "lead_statuses"
    __table_args__ = (UniqueConstraint("business_id", "name", name="uq_business_status_name"),)

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str] = mapped_column(Text, nullable=False, default="#888888", server_default="#888888")
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_won: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    is_lost: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    requires_follow_up: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    hide_from_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
