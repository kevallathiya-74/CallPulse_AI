import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CallBase(BaseModel):
    agent_id: uuid.UUID
    campaign_type: Optional[str] = None

class CallCreate(CallBase):
    uploaded_by: uuid.UUID
    audio_path: Optional[str] = None
    raw_transcript: Optional[str] = None

class CallResponse(CallBase):
    id: uuid.UUID
    uploaded_by: uuid.UUID
    audio_path: Optional[str] = None
    processed_transcript: Optional[str] = None
    duration_seconds: Optional[int] = None
    call_date: datetime
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
    
class CallStatusResponse(BaseModel):
    call_id: uuid.UUID
    status: str
    progress_percent: int
    message: str
