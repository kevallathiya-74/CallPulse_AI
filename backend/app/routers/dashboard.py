from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, desc, text
from datetime import date, datetime, timedelta

from fastapi import Request, Response
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache

def tenant_key_builder(func, namespace: str = "", request: Request = None, response: Response = None, *args, **kwargs):
    user = kwargs.get("current_user")
    org = user.organization_name if user else "public"
    url_str = str(request.url) if request else "no-url"
    return f"{FastAPICache.get_prefix()}:{namespace}:{func.__name__}:{org}:{url_str}"

from app.core.database import get_db
from app.core.clerk_auth import get_current_user
from app.models.user import User
from app.models.call import Call
from app.models.agent import Agent
from app.models.analysis import AnalysisResult
from app.utils.response_utils import success_response, error_response

router = APIRouter(tags=["dashboard"])

@router.get("/summary")
@cache(expire=60, key_builder=tenant_key_builder)
async def dashboard_summary(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role == "admin":
        org_filter = True
    elif current_user.organization_name:
        org_filter = Call.uploaded_by.in_(
            select(User.id).filter(User.organization_name == current_user.organization_name)
        )
    else:
        org_filter = Call.uploaded_by == current_user.id

    # 1. Total Calls Today
    today = func.current_date()
    total_calls_today = await db.scalar(
        select(func.count(Call.id)).filter(cast(Call.created_at, Date) == today).filter(org_filter)
    ) or 0
    
    # 2. Total Calls Month
    first_of_month = func.date_trunc('month', func.now())
    total_calls_month = await db.scalar(
        select(func.count(Call.id)).filter(Call.created_at >= first_of_month).filter(org_filter)
    ) or 0
    
    # 3. Avg Score Today & Month
    avg_score_today = await db.scalar(
        select(func.avg(AnalysisResult.composite_score))
        .join(Call)
        .filter(cast(Call.created_at, Date) == today)
        .filter(org_filter)
    ) or 0.0
    
    avg_score_month = await db.scalar(
        select(func.avg(AnalysisResult.composite_score))
        .join(Call)
        .filter(Call.created_at >= first_of_month)
        .filter(org_filter)
    ) or 0.0
    
    # 4. Compliance Rate (avg compliance score)
    compliance_rate = await db.scalar(
        select(func.avg(AnalysisResult.compliance_score))
        .join(Call)
        .filter(Call.created_at >= first_of_month)
        .filter(org_filter)
    ) or 0.0
    
    # 5. Top/Bottom Agent (this month)
    agent_stats_query = (
        select(Agent.name, func.avg(AnalysisResult.composite_score).label("avg_score"))
        .join(Call, Agent.id == Call.agent_id)
        .join(AnalysisResult, Call.id == AnalysisResult.call_id)
        .filter(Call.created_at >= first_of_month)
        .filter(org_filter)
        .group_by(Agent.id, Agent.name)
    )
    
    top_agent_res = await db.execute(agent_stats_query.order_by(desc("avg_score")).limit(1))
    top_agent = top_agent_res.first()
    
    bottom_agent_res = await db.execute(agent_stats_query.order_by("avg_score").limit(1))
    bottom_agent = bottom_agent_res.first()
    
    # 6. Status counts
    status_counts_res = await db.execute(
        select(Call.status, func.count(Call.id))
        .filter(Call.created_at >= first_of_month)
        .filter(org_filter)
        .group_by(Call.status)
    )
    status_counts = {row[0]: row[1] for row in status_counts_res.all()}
    
    # 7. Score Trend (Last 7 days)
    seven_days_ago = date.today() - timedelta(days=7)
    trend_res = await db.execute(
        select(
            cast(Call.created_at, Date).label("date"),
            func.avg(AnalysisResult.composite_score).label("avg_score"),
        )
        .join(AnalysisResult)
        .filter(cast(Call.created_at, Date) >= seven_days_ago)
        .filter(org_filter)
        .group_by("date")
        .order_by("date")
    )
    score_trend = [{"date": str(row[0]), "avg_score": round(float(row[1]), 1)} for row in trend_res.all()]
    
    recent_calls_res = await db.execute(
        select(
            Call,
            Agent.name.label("agent_name"),
            AnalysisResult.composite_score,
            AnalysisResult.processing_time_ms,
        )
        .outerjoin(Agent, Call.agent_id == Agent.id)
        .outerjoin(AnalysisResult, Call.id == AnalysisResult.call_id)
        .filter(org_filter)
        .order_by(Call.created_at.desc())
        .limit(10)
    )
    recent_calls = [
        {
            "id": str(row.Call.id),
            "agent_name": row.agent_name or "Unknown",
            "score": round(float(row.composite_score), 1) if row.composite_score is not None else None,
            "processing_time_ms": int(row.processing_time_ms) if row.processing_time_ms is not None else None,
            "status": row.Call.status,
            "created_at": row.Call.created_at.isoformat() if row.Call.created_at else None,
        }
        for row in recent_calls_res.all()
    ]
    
    data = {
        "recent_calls": recent_calls,
        "total_calls": total_calls_today,
        "total_calls_today": total_calls_today,
        "total_calls_month": total_calls_month,
        "avg_score": round(float(avg_score_today), 1),
        "avg_score_today": round(float(avg_score_today), 1),
        "avg_score_month": round(float(avg_score_month), 1),
        "compliance_rate": round(float(compliance_rate), 1),
        "top_agent": {"name": top_agent[0], "score": round(float(top_agent[1]), 1)} if top_agent else None,
        "bottom_agent": {"name": bottom_agent[0], "score": round(float(bottom_agent[1]), 1)} if bottom_agent else None,
        "calls_by_status": status_counts,
        "score_trend": score_trend
    }
    
    return success_response(data)

@router.get("/leaderboard")
@cache(expire=60, key_builder=tenant_key_builder)
async def dashboard_leaderboard(
    request: Request,
    limit: int = 10, 
    period: str = "month", 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Real leaderboard ranked by avg composite score for the period."""
    if period == "month":
        cutoff = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        cutoff = datetime.utcnow() - timedelta(days=7)
    else:
        cutoff = datetime(2000, 1, 1)

    if current_user.role == "admin":
        org_filter = True
    elif current_user.organization_name:
        org_filter = Call.uploaded_by.in_(
            select(User.id).filter(User.organization_name == current_user.organization_name)
        )
    else:
        org_filter = Call.uploaded_by == current_user.id

    query = (
        select(
            Agent.id,
            Agent.name,
            func.avg(AnalysisResult.composite_score).label("avg_score"),
            func.count(Call.id).label("total_calls"),
        )
        .join(Call, Agent.id == Call.agent_id)
        .join(AnalysisResult, Call.id == AnalysisResult.call_id)
        .filter(Call.created_at >= cutoff)
        .filter(org_filter)
        .group_by(Agent.id, Agent.name)
        .order_by(desc("avg_score"))
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    data = [
        {
            "rank": idx + 1,
            "id": str(row.id),
            "name": row.name,
            "score": round(float(row.avg_score), 1) if row.avg_score else 0.0,
            "calls": row.total_calls,
        }
        for idx, row in enumerate(rows)
    ]

    # If no data yet, return an empty list instead of dummy data
    return success_response(data)
