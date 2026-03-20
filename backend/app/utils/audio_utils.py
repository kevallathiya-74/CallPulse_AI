"""Audio utility functions for file handling and duration detection."""
import os
from loguru import logger


def get_audio_duration(file_path: str) -> float:
    """
    Get duration of an audio file in seconds.
    Falls back to 0.0 if pydub/ffmpeg not available.
    """
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(file_path)
        return len(audio) / 1000.0
    except Exception as e:
        logger.warning(f"Could not determine audio duration for {file_path}: {e}")
        return 0.0


def get_file_extension(filename: str) -> str:
    """Return lowercased file extension including the dot."""
    _, ext = os.path.splitext(filename)
    return ext.lower()


def is_audio_file(filename: str) -> bool:
    """Check if the file is an audio file."""
    return get_file_extension(filename) in {".mp3", ".wav", ".m4a"}


def is_text_file(filename: str) -> bool:
    """Check if the file is a plain text transcript."""
    return get_file_extension(filename) == ".txt"


def safe_delete_file(file_path: str) -> None:
    """Delete a file if it exists, logging any errors."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file: {file_path}")
    except Exception as e:
        logger.warning(f"Could not delete {file_path}: {e}")
