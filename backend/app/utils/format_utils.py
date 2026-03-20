def format_duration(seconds: int) -> str:
    if seconds is None:
        return "0:00"
    minutes, remaining_seconds = divmod(seconds, 60)
    return f"{minutes}:{remaining_seconds:02d}"
    
def format_score(score: float) -> str:
    return f"{score:.1f}"
