import uuid
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from starlette.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy import delete

from app.core.database import get_db
from app.core.config import get_settings
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.analysis import AnalysisResult
from app.models.call import Call
from app.schemas.report import ReportResponse, ReportShareResponse
from app.schemas.analysis import AnalysisResultResponse
from app.utils.response_utils import success_response, error_response

settings = get_settings()
router = APIRouter(tags=["reports"])

@router.get("/{report_id}")
async def get_report_by_id(report_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a specific report by ID with ownership check, including agent_name."""
    from app.models.agent import Agent
    
    # Try to find analysis by ID first, then by call_id as fallback
    analysis = None
    call = None
    agent = None

    res = await db.execute(
        select(AnalysisResult, Call, Agent)
        .join(Call, Call.id == AnalysisResult.call_id)
        .outerjoin(Agent, Agent.id == Call.agent_id)
        .filter(AnalysisResult.id == report_id)
    )
    row = res.first()
    if row:
        analysis, call, agent = row
    
    # Fallback: route id may actually be call_id (frontend links use call ids)
    if not analysis:
        res2 = await db.execute(
            select(AnalysisResult, Call, Agent)
            .join(Call, Call.id == AnalysisResult.call_id)
            .outerjoin(Agent, Agent.id == Call.agent_id)
            .filter(AnalysisResult.call_id == report_id)
        )
        row2 = res2.first()
        if row2:
            analysis, call, agent = row2

    if not analysis:
        return error_response("Report not found", status_code=404)

    # Ownership check: only the uploader or admin can view
    if current_user.role != "admin" and call and call.uploaded_by != current_user.id:
        return error_response("Access denied to this report", status_code=403)

    data = AnalysisResultResponse.model_validate(analysis).model_dump()
    # Enrich with fields the frontend needs
    data["agent_name"] = agent.name if agent else "Unknown"
    data["call_status"] = call.status if call else None
    data["duration_seconds"] = call.duration_seconds if call else None
    data["status"] = call.status if call else "pending"
    return success_response(data)


@router.get("")
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    agent_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_score: Optional[float] = Query(None, ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List reports filtered to the current user's uploads (admins see all)."""
    query = select(AnalysisResult).join(Call)

    # Non-admins only see reports from their own uploads
    if current_user.role != "admin":
        query = query.filter(Call.uploaded_by == current_user.id)

    if agent_id:
        query = query.filter(Call.agent_id == agent_id)

    if date_from:
        try:
            start = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            query = query.filter(Call.created_at >= start)
        except ValueError:
            return error_response("Invalid date_from format. Use ISO-8601.", status_code=400)

    if date_to:
        try:
            end = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            query = query.filter(Call.created_at <= end)
        except ValueError:
            return error_response("Invalid date_to format. Use ISO-8601.", status_code=400)

    if min_score is not None:
        query = query.filter(AnalysisResult.composite_score >= min_score)
        
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    res = await db.execute(query)
    reports = res.scalars().all()
    
    items = [AnalysisResultResponse.model_validate(r).model_dump() for r in reports]
    
    return success_response({
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    })

@router.get("/{report_id}/pdf")
async def get_report_pdf(report_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Download report as PDF with ownership check."""
    result = await db.execute(select(AnalysisResult).filter(AnalysisResult.id == report_id))
    analysis = result.scalars().first()

    if not analysis:
        by_call_result = await db.execute(select(AnalysisResult).filter(AnalysisResult.call_id == report_id))
        analysis = by_call_result.scalars().first()
    
    if not analysis:
        return error_response("Report not found", status_code=404)

    # Ownership check
    if current_user.role != "admin":
        call_result = await db.execute(select(Call).filter(Call.id == analysis.call_id))
        call = call_result.scalars().first()
        if call and call.uploaded_by != current_user.id:
            return error_response("Access denied to this report", status_code=403)

    pdf_path = os.path.join(settings.EXPORT_DIR, f"report_{analysis.call_id}.pdf")
    if not os.path.exists(pdf_path):
        return error_response("PDF generation pending or not found", status_code=404)
        
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"report_{analysis.call_id}.pdf")


@router.delete("/{report_id}")
async def delete_report(report_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Delete an analysis report by analysis id or call id (owner/admin only)."""
    analysis = None

    by_id = await db.execute(select(AnalysisResult).filter(AnalysisResult.id == report_id))
    analysis = by_id.scalars().first()

    if not analysis:
        by_call = await db.execute(select(AnalysisResult).filter(AnalysisResult.call_id == report_id))
        analysis = by_call.scalars().first()

    if not analysis:
        return error_response("Report not found", status_code=404)

    call_result = await db.execute(select(Call).filter(Call.id == analysis.call_id))
    call = call_result.scalars().first()

    if current_user.role != "admin" and (not call or call.uploaded_by != current_user.id):
        return error_response("Access denied to delete this report", status_code=403)

    # Remove share/report records that reference this analysis first.
    await db.execute(delete(Report).where(Report.analysis_id == analysis.id))
    await db.delete(analysis)
    await db.commit()

    return success_response({"deleted": True, "report_id": str(report_id)}, "Report deleted successfully")

@router.post("/{report_id}/share")
async def share_report(report_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Generate a share link for a report with ownership check."""
    result = await db.execute(select(AnalysisResult).filter(AnalysisResult.id == report_id))
    analysis = result.scalars().first()

    if not analysis:
        by_call_result = await db.execute(select(AnalysisResult).filter(AnalysisResult.call_id == report_id))
        analysis = by_call_result.scalars().first()
    if not analysis:
        return error_response("Report not found", status_code=404)

    # Ownership check
    if current_user.role != "admin":
        call_result = await db.execute(select(Call).filter(Call.id == analysis.call_id))
        call = call_result.scalars().first()
        if call and call.uploaded_by != current_user.id:
            return error_response("Access denied to this report", status_code=403)
        
    # Create or update report record
    share_token = str(uuid.uuid4().hex)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    rep_result = await db.execute(select(Report).filter(Report.analysis_id == analysis.id))
    report = rep_result.scalars().first()
    
    if report:
        report.shared_token = share_token
        report.expires_at = expires
    else:
        call_res = await db.execute(select(Call).filter(Call.id == analysis.call_id))
        call = call_res.scalars().first()
        report = Report(
            analysis_id=analysis.id,
            call_id=call.id,
            agent_id=call.agent_id,
            shared_token=share_token,
            expires_at=expires,
            created_by=current_user.id
        )
        db.add(report)
        
    await db.commit()
    
    return success_response({
        "share_url": f"http://localhost:5173/shared/{share_token}",
        "expires_at": expires.isoformat()
    })

@router.get("/shared/{token}")
async def get_shared_report(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).filter(Report.shared_token == token))
    report = result.scalars().first()
    
    if not report:
        return error_response("Invalid or expired share token", status_code=404)
        
    if report.expires_at and report.expires_at < datetime.now(timezone.utc):
        return error_response("Invalid or expired share token", status_code=404)

    a_result = await db.execute(select(AnalysisResult).filter(AnalysisResult.id == report.analysis_id))
    analysis = a_result.scalars().first()
    
    if not analysis:
        return error_response("Report data missing", status_code=404)
        
    return success_response(AnalysisResultResponse.model_validate(analysis).model_dump())
