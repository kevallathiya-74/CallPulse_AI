import os
from loguru import logger
from app.core.config import get_settings, model_cache

settings = get_settings()
TONE_MODEL_PATH = "./models/huggingface/roberta-base-go_emotions"

def get_tone_model():
    if "tone_model" in model_cache:
        return model_cache["tone_model"]
    # Lazy load if not in cache
    return load_tone_model()

def load_tone_model():
    if not os.path.exists(TONE_MODEL_PATH):
        logger.error(f"Tone model not found: {TONE_MODEL_PATH}")
        logger.error("Run: git clone https://huggingface.co/SamLowe/roberta-base-go_emotions backend/models/huggingface/roberta-base-go_emotions")
        return None

    try:
        from transformers import pipeline
        model = pipeline(
            "text-classification",
            model=TONE_MODEL_PATH,
            tokenizer=TONE_MODEL_PATH,
            top_k=5,
            truncation=True,
            max_length=512,
        )
        model_cache["tone_model"] = model
        logger.info(f"✓ Loaded tone_model from {TONE_MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Failed to load tone_model: {e}")
        return None

def analyze_tone(agent_segments: list[str]) -> dict:
    """Analyze tone from agent segments only."""
    model = get_tone_model()
    if not model or not agent_segments:
        return {
            "dominant_tone": "Neutral",
            "emotion_breakdown": [],
            "empathy_score": 0.0
        }
        
    try:
        # Run on segments and aggregate
        all_results = model(agent_segments)
        if all_results and isinstance(all_results[0], dict):
            all_results = [all_results]
        # Results is a list of lists of dicts e.g. [[{'label': 'approval', 'score': 0.8}, ...], ...]
        
        aggregated = {}
        total_segments = len(all_results)
        
        for segment_result in all_results:
            for emotion in segment_result:
                label = emotion['label']
                score = emotion['score']
                aggregated[label] = aggregated.get(label, 0) + score
                
        # Average out
        for k in aggregated:
            aggregated[k] = aggregated[k] / total_segments
            
        # Top 5
        top_5 = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Map to Empathetic / Professional / Frustrated / Neutral / Defensive based on general groups
        empathetic_labels = [
            "caring", "approval", "optimism", "joy", "love", "gratitude",
            "admiration", "amusement", "excitement", "relief", "pride"
        ]
        professional_labels = [
            "neutral", "realization", "curiosity", "desire", "surprise"
        ]
        frustrated_labels = [
            "annoyance", "disapproval", "anger", "disgust",
            "disappointment", "confusion", "embarrassment"
        ]
        defensive_labels = [
            "fear", "nervousness", "remorse", "grief", "sadness"
        ]
        
        empathy_score = 0.0
        dominant_tone = "Neutral"
        
        if top_5:
            top_label = top_5[0][0]
            if top_label in empathetic_labels:
                dominant_tone = "Empathetic"
            elif top_label in frustrated_labels:
                dominant_tone = "Frustrated"
            elif top_label in professional_labels:
                dominant_tone = "Professional"
            elif top_label in defensive_labels:
                dominant_tone = "Defensive"
            else:
                dominant_tone = "Neutral"
                
            empathy_score_raw = sum(
                score * (1.5 if label in ["caring", "gratitude", "love"] else 1.0)
                for label, score in aggregated.items()
                if label in empathetic_labels
            )
            empathy_score = min(100.0, empathy_score_raw * 120)
            
        return {
            "dominant_tone": dominant_tone,
            "emotion_breakdown": [{"label": k, "score": v} for k, v in top_5],
            "empathy_score": round(empathy_score, 1)
        }
    except Exception as e:
        logger.error(f"analyze_tone error: {e}")
        return {
            "dominant_tone": "Neutral",
            "emotion_breakdown": [],
            "empathy_score": 0.0
        }
