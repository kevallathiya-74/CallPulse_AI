import httpx
import json
from loguru import logger
from app.core.config import get_settings

settings = get_settings()

async def get_ollama_model() -> str:
    """Fetch tags and pick the best available LLM"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                
                # Priority mapping — llama3:latest is the installed model
                priorities = [
                    "llama3.1:70b", "llama3.1:8b",
                    "llama3:latest", "llama3:8b", "llama3",
                    "mistral:7b", "phi3:mini", "llama3.2:1b", "tinyllama"
                ]
                for p in priorities:
                    if p in models:
                        return p
                # If priority not found, return first available or fallback string
                return models[0] if models else "fallback"
    except Exception as e:
        logger.warning(f"Ollama connection error during tag discovery: {e}")
        return "fallback"
        
    return "fallback"

def fallback_summary(scores: dict = None, compliance_flags: list = None) -> dict:
    scores = scores or {}
    flags = compliance_flags or []

    sentiment = scores.get("sentiment_avg", 0)
    empathy = scores.get("empathy_score", 0)
    compliance = scores.get("compliance_score", 0)
    composite = scores.get("composite_score", 0)

    assessment = (
        "Excellent" if composite >= 85 else
        "Good" if composite >= 70 else
        "Needs Improvement" if composite >= 50 else
        "Poor"
    )

    strengths = []
    improvements = []

    if sentiment >= 75:
        strengths.append(f"Sentiment score of {sentiment} shows positive communication tone")
    if empathy >= 75:
        strengths.append(f"Empathy score of {empathy} reflects strong agent rapport")
    if not strengths:
        strengths.append("Agent maintained professional communication throughout the call")

    if compliance < 70:
        missing = ", ".join(flags) if flags else "required compliance phrases"
        improvements.append(f"Compliance score of {compliance} — missing: {missing}")
    if empathy < 60:
        improvements.append(f"Empathy score of {empathy} — work on active listening phrases")
    if not improvements:
        improvements.append("Review call script for opportunities to improve engagement")

    return {
        "summary": (
            f"Call analyzed with composite score of {composite}. "
            f"Agent performance rated as {assessment.lower()} across all dimensions."
        ),
        "strengths": strengths[:2],
        "improvements": improvements[:2],
        "action_items": [
            "Review the call recording focusing on the low-scoring dimension",
            "Complete one module in the LMS portal relevant to the lowest score",
            "Shadow a top-performing agent for one session this week",
        ],
        "overall_assessment": assessment,
    }

async def generate_coaching_summary(
    agent_text: str,
    scores: dict = None,
    compliance_flags: list = None,
) -> dict:
    scores = scores or {}
    compliance_flags = compliance_flags or []
    model = await get_ollama_model()
    if model == "fallback":
        return fallback_summary(scores, compliance_flags)

    scores_context = f"""
Dimension scores (out of 100) computed by the analysis system:
- Sentiment Arc       : {scores.get('sentiment_avg', 'N/A')}
- Tone & Empathy      : {scores.get('empathy_score', 'N/A')}
- Clarity Score       : {scores.get('clarity_score', 'N/A')}
- Script Compliance   : {scores.get('compliance_score', 'N/A')}
- Resolution Quality  : {scores.get('resolution_score', 'N/A')}
- Professional Language: {scores.get('language_score', 'N/A')}
- Composite Score     : {scores.get('composite_score', 'N/A')}
Compliance issues flagged: {', '.join(compliance_flags) if compliance_flags else 'None'}
"""

    prompt = f"""
You are a professional call center quality analyst for an Indian BPO.
Analyze this agent's call and respond ONLY in valid JSON.

{scores_context}

Agent transcript:
{agent_text[:2000]}

Based on the scores and transcript, generate a JSON response:
{{
  "summary": "2 sentences: what happened in the call and overall quality",
  "strengths": ["specific strength referencing actual score or behaviour"],
  "improvements": ["specific improvement referencing a low score or missed phrase"],
  "action_items": ["concrete next step 1", "concrete next step 2", "concrete next step 3"],
  "overall_assessment": "Excellent/Good/Needs Improvement/Poor"
}}

Rules:
- Reference actual scores in strengths/improvements (e.g. "Clarity score of 82 shows...")
- If compliance_score < 70, one improvement must address the missing phrases
- If empathy_score < 60, one action item must address tone improvement
- Respond ONLY with the JSON. No markdown. No preamble. No explanation.
    """
    
    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            resp = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if resp.status_code == 200:
                response_text = resp.json().get("response", "")
                
                # Extract JSON block if there's markdown wrapping
                start = response_text.find('{')
                end = response_text.rfind('}')
                if start != -1 and end != -1:
                    json_str = response_text[start:end+1]
                    data = json.loads(json_str)
                    return {
                        "summary": data.get("summary", ""),
                        "strengths": data.get("strengths", []),
                        "improvements": data.get("improvements", []),
                        "action_items": data.get("action_items", []),
                        "overall_assessment": data.get("overall_assessment", "Good")
                    }
    except Exception as e:
        logger.error(f"Ollama generation failed: {e}")
        
    return fallback_summary(scores, compliance_flags)
