import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analysis_results.id"), nullable=False)
    analysis = relationship("AnalysisResult")
    
    call_id = Column(UUID(as_uuid=True), ForeignKey("calls.id"), nullable=False)
    call = relationship("Call")
    
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    agent_rel = relationship("Agent")
    
    pdf_path = Column(String, nullable=True)
    shared_token = Column(String(255), unique=True, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    creator = relationship("User")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
