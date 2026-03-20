import uuid
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Any


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    organization_name: Optional[str] = None
    clerk_user_id: str


class UserSyncRequest(BaseModel):
    organization_name: Optional[str] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    organization_name: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    clerk_user_id: str
    email: EmailStr
    full_name: str
    role: str
    organization_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class APIResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    data: Optional[Any] = None
    errors: Optional[list] = None


class AuthResponse(APIResponse):
    data: Optional[Any] = None
