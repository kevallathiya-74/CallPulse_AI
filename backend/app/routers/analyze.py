import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import get_settings
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.models.agent import Agent
from app.models.call import Call
from app.models.analysis import AnalysisResult
from app.schemas.call import CallStatusResponse
from app.utils.response_utils import success_response, error_response
from app.services.analysis_pipeline import run_pipeline
from app.middleware.rate_limit_middleware import limiter

settings = get_settings()
router = APIRouter(tags=["analyze"])

ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "text/plain"]
ALLOWED_EXTS = [".mp3", ".wav", ".m4a", ".txt"]

@router.post("", status_code=202)
@limiter.limit("10/minute")
async def analyze_call(
    request: Request,
    background_tasks: BackgroundTasks,
    agent_id: str = Form(...),
    campaign_type: str = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        agent_uuid = uuid.UUID(agent_id)
    except ValueError:
        return error_response("Invalid agent_id format", status_code=400)
        
    result = await db.execute(select(Agent).filter(Agent.id == agent_uuid))
    agent = result.scalars().first()
    
    if not agent:
        return error_response("Agent not found", status_code=404)
        
    # Validation
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTS:
        return error_response("Invalid file type. Allowed: mp3, wav, m4a, txt", status_code=400)
        
    # Read first chunk to check size (could be better with custom middleware, but basic check)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        return error_response(f"File too large. Max {settings.MAX_FILE_SIZE_MB}MB", status_code=413)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_uuid = str(uuid.uuid4())
    stored_filename = f"{file_uuid}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    transcript_text = None
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            transcript_text = f.read()

    new_call = Call(
        agent_id=agent.id,
        uploaded_by=current_user.id,
        audio_path=file_path if ext != ".txt" else None,
        campaign_type=campaign_type,
        status="pending"
    )
    db.add(new_call)
    await db.commit()
    await db.refresh(new_call)
    
    background_tasks.add_task(run_pipeline, str(new_call.id), file_path, transcript_text)
    
    return success_response({"call_id": new_call.id, "message": "Analysis started"}, status_code=202)


@router.get("/status/{call_id}", response_model=None)
async def get_analysis_status(call_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Call).filter(Call.id == call_id))
    call = result.scalars().first()
    
    if not call:
        return error_response("Call not found", status_code=404)
        
    # Wait, spec says 403 (not your call) but admin can see all
    if current_user.role != "admin" and call.uploaded_by != current_user.id:
        return error_response("Access denied to this call", status_code=403)
        
    status_map = {
        "pending": 0,
        "processing": 50,
        "complete": 100,
        "failed": 0
    }

    processing_time_ms = None
    if call.status == "complete":
        analysis_result = await db.execute(
            select(AnalysisResult.processing_time_ms).filter(AnalysisResult.call_id == call_id)
        )
        processing_time_ms = analysis_result.scalar_one_or_none()
    
    data = {
        "call_id": call.id,
        "status": call.status,
        "progress_percent": status_map.get(call.status, 0),
        "message": f"Call is currently {call.status}",
        "processing_time_ms": processing_time_ms,
    }
    return success_response(data)
