from pydantic import BaseModel
from typing import Optional, Any, List

class APIResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    data: Optional[Any] = None
    errors: Optional[list] = None

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int
