"""
Demo router — pre-seeded sample data for the landing page demo preview.
No authentication required. Returns realistic mock data arrays.
"""
from fastapi import APIRouter
from fastapi_cache.decorator import cache
from app.utils.response_utils import success_response

router = APIRouter(tags=["demo"])


@router.get("/sentiment")
@cache(expire=3600)
async def demo_sentiment():
    """
    20 sentiment data points showing a real-world arc:
    positive open → drops on escalation → recovery → strong close
    """
    data = [
        {"index": 0,  "score": 88, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 1,  "score": 82, "speaker": "Customer",  "label": "POSITIVE"},
        {"index": 2,  "score": 79, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 3,  "score": 55, "speaker": "Customer",  "label": "NEGATIVE"},
        {"index": 4,  "score": 48, "speaker": "Customer",  "label": "NEGATIVE"},
        {"index": 5,  "score": 62, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 6,  "score": 38, "speaker": "Customer",  "label": "NEGATIVE"},
        {"index": 7,  "score": 35, "speaker": "Customer",  "label": "NEGATIVE"},
        {"index": 8,  "score": 58, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 9,  "score": 65, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 10, "score": 52, "speaker": "Customer",  "label": "NEGATIVE"},
        {"index": 11, "score": 70, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 12, "score": 74, "speaker": "Customer",  "label": "POSITIVE"},
        {"index": 13, "score": 80, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 14, "score": 77, "speaker": "Customer",  "label": "POSITIVE"},
        {"index": 15, "score": 85, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 16, "score": 83, "speaker": "Customer",  "label": "POSITIVE"},
        {"index": 17, "score": 88, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 18, "score": 91, "speaker": "Agent",    "label": "POSITIVE"},
        {"index": 19, "score": 92, "speaker": "Customer",  "label": "POSITIVE"},
    ]
    return success_response({"data": data})


@router.get("/scorecard")
@cache(expire=3600)
async def demo_scorecard():
    """
    All 6 quality dimensions for agent vs team average radar chart.
    """
    agent = [
        {"dimension": "Sentiment",   "score": 87},
        {"dimension": "Empathy",     "score": 88},
        {"dimension": "Clarity",     "score": 92},
        {"dimension": "Compliance",  "score": 100},
        {"dimension": "Resolution",  "score": 85},
        {"dimension": "Language",    "score": 90},
    ]
    team_average = [
        {"dimension": "Sentiment",   "score": 78},
        {"dimension": "Empathy",     "score": 75},
        {"dimension": "Clarity",     "score": 82},
        {"dimension": "Compliance",  "score": 88},
        {"dimension": "Resolution",  "score": 79},
        {"dimension": "Language",    "score": 83},
    ]
    return success_response({"agent": agent, "team_average": team_average})


@router.get("/coaching")
@cache(expire=3600)
async def demo_coaching():
    """
    Realistic coaching JSON matching the LLM output schema.
    Based on Agent Priya Mehta — sample billing dispute call.
    """
    data = {
        "summary": (
            "Agent Priya Mehta successfully de-escalated a frustrated customer "
            "experiencing a billing discrepancy on their broadband plan. She maintained "
            "professional composure throughout, issued a ₹450 credit, and achieved "
            "first-call resolution without escalating to a supervisor."
        ),
        "strengths": [
            "Maintained calm, empathetic tone when customer threatened to cancel at minute 4",
            "Used clear, jargon-free language while explaining the billing adjustment process",
            "Achieved first-call resolution without supervisor escalation",
            "Offered unprompted proactive solution — waived late fee before customer asked",
        ],
        "improvements": [
            "A brief 2–3 second pause before responding to customer concerns would signal "
            "active listening and reduce perceived defensiveness",
            "Compliance script for 'this call may be recorded' was omitted in the opening",
            "Closing did not include 'Is there anything else I can help you with?' per SOP",
        ],
        "action_items": [
            "Complete Module 3: Proactive Empathy Techniques on the LMS portal by Friday",
            "Review the billing adjustment SOP checklist — focus on the refund explanation flow",
            "Shadow top-performer Rahul Kumar (Score: 96.5) for one session this week",
        ],
        "overall_assessment": "Good",
    }
    return success_response(data)
