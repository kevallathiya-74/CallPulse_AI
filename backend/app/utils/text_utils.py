"""Text utility functions for transcript processing."""


def clean_text(text: str) -> str:
    """Strip and normalize whitespace from text."""
    if not text:
        return ""
    return " ".join(text.strip().split())


def split_by_speaker(text: str) -> dict:
    """
    Split transcript text by speaker labels.
    Looks for 'Agent:' and 'Customer:' prefixes.
    If no prefixes found, alternates paragraphs.
    Returns: { 'agent_segments': [...], 'customer_segments': [...], 'segments': [...] }
    """
    lines = text.strip().split("\n")
    agent_segments = []
    customer_segments = []
    segments = []

    has_labels = any(
        line.strip().lower().startswith(("agent:", "customer:"))
        for line in lines
    )

    if has_labels:
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if line.lower().startswith("agent:"):
                content = line[6:].strip()
                agent_segments.append(content)
                segments.append({"text": content, "speaker": "Agent"})
            elif line.lower().startswith("customer:"):
                content = line[9:].strip()
                customer_segments.append(content)
                segments.append({"text": content, "speaker": "Customer"})
    else:
        # Alternate paragraphs
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs):
            if i % 2 == 0:
                agent_segments.append(para)
                segments.append({"text": para, "speaker": "Agent"})
            else:
                customer_segments.append(para)
                segments.append({"text": para, "speaker": "Customer"})

    return {
        "full_text": text,
        "agent_segments": agent_segments,
        "customer_segments": customer_segments,
        "segments": segments,
    }


def truncate_text(text: str, max_chars: int = 4000) -> str:
    """Truncate text to max_chars for LLM prompts."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "..."


def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split()) if text else 0
