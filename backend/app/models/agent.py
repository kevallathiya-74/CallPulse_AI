import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    team = Column(String(255), nullable=False)
    
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    manager = relationship("User", foreign_keys=[manager_id])
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization = relationship("User", foreign_keys=[organization_id])
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
