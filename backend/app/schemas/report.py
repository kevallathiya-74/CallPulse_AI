import uuid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReportBase(BaseModel):
    call_id: uuid.UUID
    agent_id: uuid.UUID

class ReportCreate(ReportBase):
    analysis_id: uuid.UUID
    created_by: uuid.UUID

class ReportResponse(ReportBase):
    id: uuid.UUID
    analysis_id: uuid.UUID
    pdf_path: Optional[str] = None
    shared_token: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}

class ReportShareResponse(BaseModel):
    share_url: str
    expires_at: datetime
