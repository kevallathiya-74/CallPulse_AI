from pydantic import BaseModel
from fastapi import APIRouter, Request
from fastapi import Response
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from app.utils.response_utils import success_response, error_response
from app.middleware.rate_limit_middleware import limiter

router = APIRouter(tags=["roi"])

class ROIRequest(BaseModel):
    agents: int


def roi_key_builder(func, namespace: str = "", request: Request = None, response: Response = None, *args, **kwargs):
    body = kwargs.get("body")
    agents = getattr(body, "agents", "na")
    method = request.method if request else "unknown"
    path = request.url.path if request else "no-path"
    return f"{FastAPICache.get_prefix()}:{namespace}:{func.__name__}:{method}:{path}:{agents}"

@router.post("/calculate")
@limiter.limit("30/minute")
@cache(expire=300, key_builder=roi_key_builder)
async def calculate_roi(request: Request, body: ROIRequest):
    if body.agents < 1 or body.agents > 100000:
        return error_response("Agents must be between 1 and 100,000", status_code=400)
        
    agents = body.agents
    
    # Formula aligned with value proposition: ₹23.76L/year for 300 agents
    # 2,376,000 / 12 / 300 = 660 per agent per month
    monthly = agents * 660
    annual = monthly * 12
    
    data = {
        "agents": agents,
        "monthly_savings": int(monthly),
        "annual_savings": int(annual),
        "total_savings": int(annual),
        "savings_per_agent": int(annual / agents),
        "coverage_before": "3%",
        "coverage_after": "100%",
        "payback_period_days": 14,
        "payback_months": 1,
        "roi_percent": 320,
    }
    
    return success_response(data)
