import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Business(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "businesses"

    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    business_mode: Mapped[str] = mapped_column(Text, nullable=False, default="general_sales", server_default="general_sales")
    sheet_id: Mapped[str | None] = mapped_column(Text)
    sheet_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    sheet_tab_name: Mapped[str] = mapped_column(Text, nullable=False, default="Sheet1", server_default="Sheet1")
    sheet_column_mapping: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    enabled_modules: Mapped[list[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    automation_settings: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    notification_settings: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    sheet_last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
