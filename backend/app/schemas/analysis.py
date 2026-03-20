import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class SentimentPoint(BaseModel):
    index: int
    score: float
    label: str
    speaker: str

class DimensionScore(BaseModel):
    dimension: str
    score: float

class LLMSummary(BaseModel):
    summary: str
    strengths: List[str]
    improvements: List[str]
    action_items: List[str]
    overall_assessment: str

class AnalysisResultResponse(BaseModel):
    id: uuid.UUID
    call_id: uuid.UUID
    
    sentiment_scores: Optional[List[SentimentPoint]] = None
    sentiment_arc: Optional[List[float]] = None
    tone_labels: Optional[Any] = None
    emotion_scores: Optional[Any] = None
    
    clarity_score: Optional[float] = None
    filler_word_count: Optional[int] = None
    speaking_pace: Optional[float] = None
    
    compliance_flags: Optional[List[str]] = None
    compliance_score: Optional[float] = None
    
    resolution_quality: Optional[float] = None
    language_score: Optional[float] = None
    
    composite_score: Optional[float] = None
    llm_summary: Optional[LLMSummary] = None
    
    processing_time_ms: Optional[int] = None
    model_versions: Optional[Any] = None
    
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
