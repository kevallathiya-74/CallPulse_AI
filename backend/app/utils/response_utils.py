from typing import Any, Optional, List
from app.schemas.common import APIResponse

def success_response(data: Optional[Any] = None, message: str = "Success", status_code: int = 200) -> dict:
    res = APIResponse(
        success=True,
        status_code=status_code,
        message=message,
        data=data,
        errors=None
    )
    return res.model_dump()

def error_response(message: str, status_code: int = 400, errors: Optional[List[Any]] = None) -> dict:
    res = APIResponse(
        success=False,
        status_code=status_code,
        message=message,
        data=None,
        errors=errors
    )
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=status_code, content=res.model_dump())
