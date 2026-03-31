import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class InventoryTemplate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "inventory_templates"

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    event_type_match: Mapped[str | None] = mapped_column(Text, index=True)
    note: Mapped[str | None] = mapped_column(Text)
    items: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
