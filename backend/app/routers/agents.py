import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from collections import Counter

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
from app.models.agent import Agent
from app.models.call import Call
from app.models.analysis import AnalysisResult
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.utils.response_utils import success_response, error_response

router = APIRouter(tags=["agents"])

@router.get("")
@cache(expire=60, key_builder=tenant_key_builder)
async def list_agents(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = None,
    sort_by: str = None,
    sort_dir: str = "asc",
    team: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Build a single aggregated query so each agent row includes live metrics
    metrics_query = (
        select(
            Agent.id,
            Agent.name,
            Agent.email,
            Agent.team,
            Agent.is_active,
            Agent.created_at,
            Agent.manager_id,
            Agent.organization_id,
            func.count(Call.id).label("calls_analyzed"),
            func.avg(AnalysisResult.composite_score).label("avg_score"),
            func.avg(AnalysisResult.compliance_score).label("compliance_pct"),
            func.max(Call.created_at).label("last_active"),
        )
        .outerjoin(Call, Call.agent_id == Agent.id)
        .outerjoin(AnalysisResult, AnalysisResult.call_id == Call.id)
        .filter(Agent.is_active == True)
        .group_by(
            Agent.id, Agent.name, Agent.email, Agent.team,
            Agent.is_active, Agent.created_at, Agent.manager_id, Agent.organization_id
        )
    )

    if search:
        metrics_query = metrics_query.filter(Agent.name.ilike(f"%{search}%"))
    if team:
        metrics_query = metrics_query.filter(Agent.team == team)

    # Org isolation
    if current_user.role != "admin" and current_user.organization_name:
        org_user_ids_q = select(User.id).filter(User.organization_name == current_user.organization_name)
        metrics_query = metrics_query.filter(Agent.organization_id.in_(org_user_ids_q))

    # Count for pagination (count distinct agents)
    count_subq = metrics_query.subquery()
    total = await db.scalar(select(func.count()).select_from(count_subq)) or 0

    # Sorting
    sort_col = {
        "avg_score": func.avg(AnalysisResult.composite_score),
        "calls_analyzed": func.count(Call.id),
        "last_active": func.max(Call.created_at),
        "name": Agent.name,
    }.get(sort_by or "name", Agent.name)

    if sort_dir == "desc":
        metrics_query = metrics_query.order_by(sort_col.desc())
    else:
        metrics_query = metrics_query.order_by(sort_col)

    offset = (page - 1) * per_page
    metrics_query = metrics_query.offset(offset).limit(per_page)

    result = await db.execute(metrics_query)
    rows = result.all()

    items = [
        {
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "team": row.team,
            "is_active": row.is_active,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "calls_analyzed": int(row.calls_analyzed or 0),
            "avg_score": round(float(row.avg_score), 1) if row.avg_score is not None else None,
            "compliance_pct": round(float(row.compliance_pct), 1) if row.compliance_pct is not None else None,
            "last_active": row.last_active.isoformat() if row.last_active else None,
        }
        for row in rows
    ]

    total_pages = (total + per_page - 1) // per_page
    data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
    return success_response(data)


@router.post("", status_code=201)
async def create_agent(agent_data: AgentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Agent).filter(func.lower(Agent.email) == agent_data.email.lower())
    )
    if result.scalars().first():
        return error_response("Agent email already exists", status_code=409)
        
    new_agent = Agent(
        name=agent_data.name,
        email=agent_data.email,
        team=agent_data.team,
        manager_id=agent_data.manager_id,
        organization_id=current_user.id # Simplified org assignment
    )
    
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    
    return success_response(AgentResponse.model_validate(new_agent).model_dump(), "Agent created", status_code=201)

@router.get("/{agent_id}")
async def get_agent(agent_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    
    if not agent:
        return error_response("Agent not found", status_code=404)
        
    # Fetch real stats for the agent
    stats_query = (
        select(
            func.avg(AnalysisResult.composite_score).label("avg_score"),
            func.avg(AnalysisResult.clarity_score).label("avg_clarity"),
            func.avg(AnalysisResult.compliance_score).label("avg_compliance"),
            func.avg(AnalysisResult.resolution_quality).label("avg_resolution"),
            func.avg(AnalysisResult.language_score).label("avg_language")
        )
        .join(Call)
        .filter(Call.agent_id == agent_id)
    )
    stats_res = await db.execute(stats_query)
    stats = stats_res.first()
    
    # Fetch trend and JSON-based stats (last 10 calls)
    trend_query = (
        select(AnalysisResult)
        .join(Call)
        .filter(Call.agent_id == agent_id)
        .order_by(desc(Call.created_at))
        .limit(10)
    )
    trend_res = await db.execute(trend_query)
    recent_analyses = trend_res.scalars().all()
    
    trend = [float(a.composite_score or 0) for a in recent_analyses]
    trend.reverse() # Chronological
    
    # Compute Sentiment and Empathy from JSON fields
    sentiment_scores = []
    empathy_scores = []
    for a in recent_analyses:
        if isinstance(a.sentiment_arc, list) and len(a.sentiment_arc) > 0:
            avg_sent = sum(float(x or 0) for x in a.sentiment_arc) / len(a.sentiment_arc)
            sentiment_scores.append(avg_sent)
        if isinstance(a.tone_labels, dict) and 'empathy_score' in a.tone_labels:
            empathy_scores.append(float(a.tone_labels['empathy_score']))

    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
    avg_empathy = sum(empathy_scores) / len(empathy_scores) if empathy_scores else 0.0

    # Pick most frequent real dominant tone from recent analyses.
    tone_labels = []
    for a in recent_analyses:
        if isinstance(a.tone_labels, dict):
            label = a.tone_labels.get("dominant_tone")
            if isinstance(label, str) and label.strip():
                tone_labels.append(label.strip())
    if tone_labels:
        dominant_tone = Counter(tone_labels).most_common(1)[0][0]
    else:
        # Backward-compatible fallback for old analyses that only stored empathy_score.
        if avg_empathy >= 80:
            dominant_tone = "Empathetic"
        elif avg_empathy >= 60:
            dominant_tone = "Professional"
        elif avg_empathy >= 40:
            dominant_tone = "Neutral"
        else:
            dominant_tone = "Needs Empathy"
    
    data = AgentResponse.model_validate(agent).model_dump()
    data["avg_score"] = round(float(stats.avg_score), 1) if stats.avg_score else 0.0
    data["compliance_pct"] = round(float(stats.avg_compliance), 1) if stats.avg_compliance is not None else 0.0
    data["trend"] = trend
    data["dimension_averages"] = {
        "clarity": round(float(stats.avg_clarity), 1) if stats.avg_clarity else 0.0,
        "compliance": round(float(stats.avg_compliance), 1) if stats.avg_compliance else 0.0,
        "resolution": round(float(stats.avg_resolution), 1) if stats.avg_resolution else 0.0,
        "professional_language": round(float(stats.avg_language), 1) if stats.avg_language else 0.0,
        "sentiment_arc": round(avg_sentiment, 1),
        "tone_&_empathy": round(avg_empathy, 1),
        "tone_label": dominant_tone,
    }
    data["tone_label"] = dominant_tone
    
    return success_response(data)

@router.put("/{agent_id}")
async def update_agent(agent_id: uuid.UUID, agent_data: AgentUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    
    if not agent:
        return error_response("Agent not found", status_code=404)
        
    if agent_data.name is not None: agent.name = agent_data.name
    if agent_data.email is not None: agent.email = agent_data.email
    if agent_data.team is not None: agent.team = agent_data.team
    if agent_data.is_active is not None: agent.is_active = agent_data.is_active
    
    await db.commit()
    await db.refresh(agent)
    
    return success_response(AgentResponse.model_validate(agent).model_dump())

@router.get("/{agent_id}/reports")
async def get_agent_reports(
    agent_id: uuid.UUID, 
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Agent).filter(Agent.id == agent_id))
    agent = result.scalars().first()
    
    if not agent:
        return error_response("Agent not found", status_code=404)
        
    query = select(AnalysisResult).join(Call).filter(Call.agent_id == agent_id).order_by(desc(AnalysisResult.created_at))
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)
    
    res = await db.execute(query)
    analyses = res.scalars().all()
    
    items = []
    for a in analyses:
        items.append({
            "id": a.id,
            "call_id": a.call_id,
            "composite_score": a.composite_score,
            "created_at": a.created_at
        })
        
    total_pages = (total + per_page - 1) // per_page
    data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
    return success_response(data)
