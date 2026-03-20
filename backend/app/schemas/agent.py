import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

class AgentBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    team: str = Field(default="General", min_length=2, max_length=100)

    @field_validator("name", "team", mode="before")
    @classmethod
    def normalize_text_fields(cls, value):
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Field is required")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value

class AgentCreate(AgentBase):
    manager_id: Optional[uuid.UUID] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    team: Optional[str] = Field(default=None, min_length=2, max_length=100)
    manager_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None

    @field_validator("name", "team", mode="before")
    @classmethod
    def normalize_optional_text_fields(cls, value):
        if value is None:
            return value
        if isinstance(value, str):
            value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_optional_email(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value

class AgentResponse(AgentBase):
    # Keep response tolerant of legacy/internal addresses (e.g., *.local)
    # already present in persisted data.
    email: str
    id: uuid.UUID
    manager_id: Optional[uuid.UUID] = None
    organization_id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
