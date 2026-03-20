import re


def _count_syllables(word: str) -> int:
    # Approximate syllable count for readability scoring.
    word = re.sub(r"[^a-z]", "", word.lower())
    if not word:
        return 0

    vowels = "aeiouy"
    syllables = 0
    prev_is_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            syllables += 1
        prev_is_vowel = is_vowel

    if word.endswith("e") and syllables > 1:
        syllables -= 1

    return max(1, syllables)


def _flesch_reading_ease(text: str) -> float:
    # Flesch Reading Ease = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    text = (text or "").strip()
    if not text:
        return 0.0

    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"\b[\w']+\b", text)
    if not words:
        return 0.0

    sentence_count = max(1, len(sentences))
    word_count = len(words)
    syllable_count = sum(_count_syllables(word) for word in words)

    return 206.835 - (1.015 * (word_count / sentence_count)) - (84.6 * (syllable_count / word_count))

FILLER_WORDS = [
    r"\bum\b", r"\buh\b", r"\blike\b", r"\byou know\b",
    r"\bbasically\b", r"\bliterally\b", r"\bactually\b",
    r"\bright\b", r"\bokay so\b", r"\bso yeah\b",
    r"\bi mean\b", r"\bkind of\b", r"\bsort of\b",
    r"\banyways\b", r"\bwhatever\b", r"\byeah so\b",
    r"\bokay okay\b", r"\balright so\b", r"\bso basically\b",
]

def analyze_clarity(agent_text: str, duration_minutes: float) -> dict:
    """Analyze clarity based on Flesch, filler words, and speaking pace."""
    if not agent_text:
        return {
            "clarity_score": 0.0,
            "filler_word_count": 0,
            "speaking_pace": 0.0
        }
        
    try:
        # Readability (Flesch)
        flesch = _flesch_reading_ease(agent_text)
        # Normalize 0-100 logic: Flesch is largely 0-100, occasionally higher/lower
        flesch_score = max(0, min(100, flesch))
        
        # Filler words
        filler_count = sum(len(re.findall(pattern, agent_text, re.IGNORECASE)) for pattern in FILLER_WORDS)
        # Assuming ~5 fillers per minute is "bad", 0 is perfect
        filler_penalty = min(100, filler_count * 5)
        filler_score = max(0, 100 - filler_penalty)
        
        # Pace
        word_count = len(agent_text.split())
        pace = word_count / duration_minutes if duration_minutes > 0 else 130.0 # conversational default
        
        # Ideal pace ~130-150 wpm.
        ideal_pace_diff = abs(pace - 140)
        pace_penalty = min(100, ideal_pace_diff * 0.5)
        pace_score = max(0, 100 - pace_penalty)
        
        # Jargon penalty
        jargon_words = ["leverage", "synergy", "paradigm", "bandwidth", "actionable"]
        jargon_count = sum(len(re.findall(rf"\b{word}\b", agent_text, re.IGNORECASE)) for word in jargon_words)
        jargon_score = max(0, 100 - (jargon_count * 10))
        
        # Weighted avg: Readability 40%, Filler 30%, Jargon 30% (assuming pace is tracked but not in core score)
        clarity_score = (flesch_score * 0.4) + (filler_score * 0.3) + (jargon_score * 0.3)

        interruption_count = 0
        for segment in agent_text.split("\n"):
            if re.search(r"--\s*$|—\s*$|\.\.\.\s*$", segment):
                interruption_count += 1

        interruption_penalty = min(20, interruption_count * 3)
        clarity_score = max(0, clarity_score - interruption_penalty)
        
        return {
            "clarity_score": round(clarity_score, 1),
            "filler_word_count": filler_count,
            "speaking_pace": round(pace, 1),
            "interruption_count": interruption_count,
        }
    except Exception as e:
        return {
            "clarity_score": 0.0,
            "filler_word_count": 0,
            "speaking_pace": 0.0
        }
