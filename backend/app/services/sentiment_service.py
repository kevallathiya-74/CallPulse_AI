import os
from loguru import logger
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.core.config import get_settings, model_cache

settings = get_settings()
SENTIMENT_MODEL_PATH = "./models/huggingface/distilbert-base-uncased-finetuned-sst-2-english"
_vader = SentimentIntensityAnalyzer()

def get_sentiment_model():
    if "sentiment_model" in model_cache:
        return model_cache["sentiment_model"]
    # Lazy load if not in cache
    return load_sentiment_model()

def load_sentiment_model():
    if not os.path.exists(SENTIMENT_MODEL_PATH):
        logger.error(f"Sentiment model not found: {SENTIMENT_MODEL_PATH}")
        logger.error("Run: git clone https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english backend/models/huggingface/distilbert-base-uncased-finetuned-sst-2-english")
        return None

    try:
        from transformers import pipeline
        model = pipeline(
            "sentiment-analysis",
            model=SENTIMENT_MODEL_PATH,
            tokenizer=SENTIMENT_MODEL_PATH,
            truncation=True,
            max_length=512,
        )
        model_cache["sentiment_model"] = model
        logger.info(f"✓ Loaded sentiment_model from {SENTIMENT_MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Failed to load sentiment_model: {e}")
        return None

def analyze_sentiment(segments: list[dict]) -> tuple[list[dict], list[float], float, int | None]:
    """
    Input segments: [{"text": "Hello", "speaker": "Agent"}, ...]
    Returns (sentiment_results, sentiment_arc, agent_avg, recovery_index)
    """
    model = get_sentiment_model()
    if not model or not segments:
        return [], [], 0.0, None
        
    try:
        non_empty_batch = []
        non_empty_positions = []
        for idx, seg in enumerate(segments):
            text = str(seg.get("text", "")).strip()
            if text:
                non_empty_batch.append(text)
                non_empty_positions.append(idx)

        model_results = model(non_empty_batch) if non_empty_batch else []
        result_by_position = {
            pos: res for pos, res in zip(non_empty_positions, model_results)
        }
        
        sentiment_data = []
        arc = []
        agent_scores = []
        
        for i, seg in enumerate(segments):
            raw_text = str(seg.get("text", ""))
            text = raw_text.strip()

            if not text:
                label = "NEUTRAL"
                final_score = 50.0
            else:
                res = result_by_position.get(i)
                label = (res or {}).get("label", "NEUTRAL")
                score = float((res or {}).get("score", 0.5))

                if label == "POSITIVE":
                    distilbert_score = score * 100
                else:
                    distilbert_score = (1 - score) * 100

                vader_scores = _vader.polarity_scores(text)
                vader_compound = vader_scores.get("compound", 0.0)
                vader_normalized = ((vader_compound + 1) / 2) * 100
                final_score = (distilbert_score * 0.70) + (vader_normalized * 0.30)

            sentiment_data.append({
                "index": i,
                "text": raw_text,
                "score": round(final_score, 1),
                "label": label,
                "speaker": seg.get("speaker", "Agent")
            })
            arc.append(round(final_score, 1))
            
            if seg.get("speaker") == "Agent":
                agent_scores.append(final_score)

        agent_avg = sum(agent_scores) / len(agent_scores) if agent_scores else 50.0

        recovery_index = None
        for i in range(2, len(arc)):
            if arc[i - 2] < 50 and arc[i - 1] < 50 and arc[i] >= 65:
                recovery_index = i
                break
        
        return sentiment_data, arc, round(agent_avg, 1), recovery_index
        
    except Exception as e:
        logger.error(f"analyze_sentiment error: {e}")
        return [], [], 0.0, None
