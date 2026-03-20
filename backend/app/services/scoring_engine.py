from loguru import logger


def calculate_composite_score(scores: dict) -> float:
    """
    Weighted composite across all 6 quality dimensions.
    Weights revised to include Professional Language:
      Sentiment Arc     : 25%
      Tone & Empathy    : 20%
      Clarity Score     : 18%
      Script Compliance : 17%
      Resolution Quality: 12%
      Professional Lang : 8%
      Total             : 100%
    """
    try:
        sentiment = float(scores.get("sentiment_avg", 0.0))
        empathy = float(scores.get("empathy_score", 0.0))
        clarity = float(scores.get("clarity_score", 0.0))
        compliance = float(scores.get("compliance_score", 0.0))
        resolution = float(scores.get("resolution_score", 0.0))
        language = float(scores.get("language_score", 0.0))

        composite = (
            (sentiment * 0.25) +
            (empathy * 0.20) +
            (clarity * 0.18) +
            (compliance * 0.17) +
            (resolution * 0.12) +
            (language * 0.08)
        )

        return round(min(100.0, max(0.0, composite)), 1)
    except Exception as e:
        logger.error(f"Scoring error: {e}")
        return 0.0
