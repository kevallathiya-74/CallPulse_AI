import re

INAPPROPRIATE_WORDS = [
    r"\bidiot\b", r"\bstupid\b", r"\bdumb\b", r"\bshut up\b"
]

def analyze_language(agent_segments: list[str]) -> float:
    """
    Penalize inappropriate words, ALL CAPS segments.
    """
    violations = 0
    
    for segment in agent_segments:
        # Check all caps (ignoring short segments under 5 chars)
        if segment.isupper() and len(segment) > 5:
            violations += 1
            
        # Check inappropriate words
        for pattern in INAPPROPRIATE_WORDS:
            if re.search(pattern, segment, re.IGNORECASE):
                violations += 2
                
    score = max(0, 100 - (violations * 10))
    return float(score)
