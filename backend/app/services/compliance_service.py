import re

REQUIRED_PHRASES = {
    "greeting": [
        "thank you for calling",
        "how may i help",
        "how can i help",
        "good morning",
        "good afternoon",
        "good evening",
        "welcome to",
        "how may i assist",
    ],
    "disclaimer": [
        "this call may be recorded",
        "for quality purposes",
        "for training purposes",
        "calls are monitored",
    ],
    "verification": [
        "can i have your name",
        "may i know your name",
        "can you confirm",
        "verify your",
        "date of birth",
        "account number",
        "policy number",
    ],
    "empathy_acknowledgement": [
        "i understand",
        "i apologize",
        "i am sorry",
        "i can understand",
        "that must be",
        "i completely understand",
    ],
    "closing": [
        "is there anything else",
        "anything else i can help",
        "have a great day",
        "thank you for calling",
        "have a good day",
        "thank you for your time",
    ],
}

PHRASE_WEIGHTS = {
    "greeting": 1.5,
    "disclaimer": 2.0,
    "verification": 1.5,
    "empathy_acknowledgement": 1.0,
    "closing": 1.0,
}

def check_compliance(agent_text: str) -> tuple[float, list[str]]:
    """Checks for required compliance phrases."""
    if not agent_text:
        return 0.0, list(REQUIRED_PHRASES.keys())
        
    flags = []
    present_count = 0
    
    agent_lower = agent_text.lower()
    
    for category, phrases in REQUIRED_PHRASES.items():
        found = False
        for phrase in phrases:
            if re.search(r'\b' + re.escape(phrase) + r'\b', agent_lower):
                found = True
                break
                
        if found:
            present_count += 1
        else:
            flags.append(f"Missing {category} phrase")

    missing_categories = [
        flag.replace("Missing ", "").replace(" phrase", "")
        for flag in flags
    ]
    total_weight = sum(PHRASE_WEIGHTS.values())
    earned_weight = sum(
        PHRASE_WEIGHTS[cat] for cat in REQUIRED_PHRASES
        if cat not in missing_categories
    )
    score = (earned_weight / total_weight) * 100 if total_weight else 0.0
    
    return round(score, 1), flags
