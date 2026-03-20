import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    agent = relationship("Agent")
    
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploader = relationship("User")
    
    audio_path = Column(String, nullable=True)
    raw_transcript = Column(String, nullable=True)
    processed_transcript = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    call_date = Column(DateTime(timezone=True), server_default=func.now())
    campaign_type = Column(String(100), nullable=True)
    
    # pending, processing, complete, failed
    status = Column(String(50), default="pending", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
