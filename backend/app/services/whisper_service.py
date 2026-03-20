try:
    import whisper as _whisper_lib
    _WHISPER_AVAILABLE = True
except ImportError:
    _whisper_lib = None
    _WHISPER_AVAILABLE = False
from loguru import logger
from app.core.config import get_settings, model_cache
import os
import re

settings = get_settings()


def _preprocess_text(text: str) -> str:
    """
    Clean transcript text before analysis.
    - Normalize whitespace and line endings
    - Remove filler noise characters ([inaudible], [crosstalk], etc.)
    - Normalize punctuation for better sentence splitting
    - Preserve Agent:/Customer: labels
    """
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\[inaudible\]|\[crosstalk\]|\[noise\]|\[background\]", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[\[\(]\d{1,2}:\d{2}(?::\d{2})?[\]\)]", "", text)
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(line for line in lines if line)
    return text.strip()


def _split_by_prefix(full_text: str) -> dict:
    """
    Parse transcripts that have Agent:/Customer: prefixes.
    Falls back to alternating split if no prefixes found.
    """
    lines = [line.strip() for line in (full_text or "").strip().split("\n") if line.strip()]
    segments = []
    agent_segments = []
    customer_segments = []

    has_labels = any(
        line.lower().startswith("agent:")
        or line.lower().startswith("customer:")
        or line.lower().startswith("agent :")
        or line.lower().startswith("customer :")
        for line in lines
    )

    if has_labels:
        for line in lines:
            line_lower = line.lower()
            if line_lower.startswith("agent:") or line_lower.startswith("agent :"):
                text = line.split(":", 1)[1].strip()
                if text:
                    segments.append({"text": text, "speaker": "Agent"})
                    agent_segments.append(text)
            elif line_lower.startswith("customer:") or line_lower.startswith("customer :"):
                text = line.split(":", 1)[1].strip()
                if text:
                    segments.append({"text": text, "speaker": "Customer"})
                    customer_segments.append(text)
    else:
        logger.warning(
            "No Agent:/Customer: labels found in transcript. "
            "Using alternating split — add speaker labels for accurate analysis."
        )
        raw = full_text.replace("? ", "?\n").replace(". ", ".\n").replace("! ", "!\n")
        split_lines = [line.strip() for line in raw.split("\n") if line.strip()]
        current = "Agent"
        for line in split_lines:
            segments.append({"text": line, "speaker": current})
            if current == "Agent":
                agent_segments.append(line)
                current = "Customer"
            else:
                customer_segments.append(line)
                current = "Agent"

    if not customer_segments:
        customer_segments = [""]

    return {
        "full_text": full_text,
        "agent_segments": agent_segments,
        "customer_segments": customer_segments,
        "segments": segments,
        "has_speaker_labels": has_labels,
    }

def get_whisper_model():
    """Get the Whisper model, loading it on-demand if not already cached."""
    if "whisper_model" in model_cache:
        return model_cache["whisper_model"]
    # Auto-load on first use (handles background task contexts)
    return load_whisper_model()

def load_whisper_model():
    if _whisper_lib is None:
        logger.warning("openai-whisper not installed — whisper_model unavailable")
        return None
    model_size = settings.WHISPER_MODEL_SIZE
    try:
        model = _whisper_lib.load_model(model_size)
        model_cache["whisper_model"] = model
        logger.info(f"✓ Loaded whisper_model ({model_size})")
        return model
    except Exception as e:
        logger.error(f"Failed to load whisper_model ({model_size}): {e}")
        return None

def transcribe_audio(file_path: str) -> dict:
    """
    Transcribes audio to text and attempts to separate by speakers if stereophonic / diarized.
    For this basic implementation, we will use plain transcribe, and auto-split paragraphs.
    Output: { full_text, agent_segments, customer_segments, segments: [{"text", "speaker"}, ...] }
    """
    model = get_whisper_model()
    if not model:
        raise RuntimeError("Whisper model not loaded")
        
    try:
        result = model.transcribe(file_path)
        full_text = _preprocess_text(result.get("text", ""))
        return _split_by_prefix(full_text)
        
    except Exception as e:
        logger.error(f"transcribe_audio error: {e}")
        raise
