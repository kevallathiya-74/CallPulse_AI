from loguru import logger
from importlib.metadata import version as pkg_version, PackageNotFoundError

# Global setup block in main.py will cache this
nlp = None

def get_spacy_model():
    global nlp
    if nlp is None:
        try:
            import spacy as _spacy_lib
            spacy_ver = pkg_version("spacy")
            try:
                model_ver = pkg_version("en-core-web-sm")
            except PackageNotFoundError:
                model_ver = None

            if model_ver and spacy_ver.split(".")[:2] == model_ver.split(".")[:2]:
                nlp = _spacy_lib.load("en_core_web_sm")
                logger.info("✓ Loaded spacy (en_core_web_sm)")
            else:
                nlp = _spacy_lib.blank("en")
                logger.info(
                    f"spaCy/model mismatch (spacy={spacy_ver}, en_core_web_sm={model_ver or 'missing'}) — using blank English NLP"
                )
        except Exception as e:
            logger.warning(f"spacy not available — resolution NLP using fallback: {e}")
    return nlp

def analyze_resolution(customer_text: str, agent_text: str) -> float:
    """Evaluate resolution using SpaCy pattern matching."""
    if not agent_text:
        return 0.0
        
    model = get_spacy_model()
    # Simple regex as fallback if model fails
    agent_lower = agent_text.lower()
    
    indicators = [
        "i will", 
        "i'll make sure", 
        "i've updated", 
        "ticket number", 
        "follow up", 
        "resolved"
    ]
    
    matched = 0
    for indicator in indicators:
        if indicator in agent_lower:
            matched += 1
            
    # Assuming 5 matches = 100% score as per docs
    score = min((matched / 5) * 100, 100.0)
    
    return round(score, 1)
