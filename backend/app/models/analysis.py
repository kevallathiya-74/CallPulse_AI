import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_id = Column(UUID(as_uuid=True), ForeignKey("calls.id"), unique=True, nullable=False)
    call = relationship("Call", backref="analysis")
    
    sentiment_scores = Column(JSONB, nullable=True)
    sentiment_arc = Column(JSONB, nullable=True)
    tone_labels = Column(JSONB, nullable=True)
    emotion_scores = Column(JSONB, nullable=True)
    
    clarity_score = Column(Float, nullable=True)
    filler_word_count = Column(Integer, nullable=True)
    speaking_pace = Column(Float, nullable=True)
    
    compliance_flags = Column(JSONB, nullable=True)
    compliance_score = Column(Float, nullable=True)
    
    resolution_quality = Column(Float, nullable=True)
    language_score = Column(Float, nullable=True)
    
    composite_score = Column(Float, nullable=True)
    llm_summary = Column(JSONB, nullable=True)
    
    processing_time_ms = Column(Integer, nullable=True)
    model_versions = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
