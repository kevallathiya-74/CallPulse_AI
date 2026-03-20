import time
from loguru import logger
from app.core.config import get_settings
try:
    from app.services.whisper_service import transcribe_audio, _split_by_prefix, _preprocess_text
except ImportError:
    transcribe_audio = None
    _split_by_prefix = None
    _preprocess_text = None
try:
    from app.services.sentiment_service import analyze_sentiment
except ImportError:
    analyze_sentiment = None
try:
    from app.services.tone_service import analyze_tone
except ImportError:
    analyze_tone = None
try:
    from app.services.clarity_service import analyze_clarity
except ImportError:
    analyze_clarity = None
try:
    from app.services.compliance_service import check_compliance
except ImportError:
    check_compliance = None
try:
    from app.services.resolution_service import analyze_resolution
except ImportError:
    analyze_resolution = None
try:
    from app.services.language_service import analyze_language
except ImportError:
    analyze_language = None
try:
    from app.services.ollama_service import generate_coaching_summary
except ImportError:
    generate_coaching_summary = None
try:
    from app.services.scoring_engine import calculate_composite_score
except ImportError:
    calculate_composite_score = None
try:
    from app.services.pdf_service import generate_pdf_report
except ImportError:
    generate_pdf_report = None

from app.models.analysis import AnalysisResult
from app.models.call import Call
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.agent import Agent
from app.models.user import User

async def run_pipeline(call_id: str, file_path: str, transcript_text: str = None) -> None:
    """End-to-end analysis pipeline."""
    start_time = time.time()
    logger.info(f"Pipeline started: call_id={call_id}")
    
    # Use a completely fresh DB session for the background task
    async with AsyncSessionLocal() as db:
        # 0. Fetch Call record
        result = await db.execute(select(Call).filter(Call.id == call_id))
        call = result.scalars().first()
        
        if not call:
            logger.error(f"Pipeline error: call_id {call_id} not found in DB")
            return

        agent_result = await db.execute(select(Agent).filter(Agent.id == call.agent_id))
        if not agent_result.scalars().first():
            logger.error(f"Pipeline error: agent_id {call.agent_id} not found for call_id={call_id}")
            call.status = "failed"
            await db.commit()
            return

        uploader_result = await db.execute(select(User).filter(User.id == call.uploaded_by))
        if not uploader_result.scalars().first():
            logger.error(f"Pipeline error: uploaded_by {call.uploaded_by} not found for call_id={call_id}")
            call.status = "failed"
            await db.commit()
            return
            
        call.status = "processing"
        await db.commit()
        
        # Init dimensions
        scores = {}
        analysis_data = {}
        
        # 1. Transcription (Run in ThreadPool to NOT block FastAPI Event Loop)
        try:
            t_start = time.time()
            if file_path and file_path.lower().endswith(('.mp3', '.wav', '.m4a')):
                if not transcribe_audio: raise Exception("Whisper module unavailable")
                # VERY IMPORTANT: Offload CPU-bound ML to thread!
                transcription = await asyncio.to_thread(transcribe_audio, file_path)
                call.raw_transcript = transcription["full_text"]
            else:
                if transcript_text:
                    cleaned = _preprocess_text(transcript_text) if _preprocess_text else transcript_text
                    call.raw_transcript = cleaned
                raw = call.raw_transcript or ""
                transcription = _split_by_prefix(raw) if _split_by_prefix else {
                    "full_text": raw,
                    "agent_segments": [raw] if raw else [],
                    "customer_segments": [""],
                    "segments": [{"text": raw, "speaker": "Agent"}] if raw else [],
                }
            
            segments = transcription.get("segments", [])
            agent_segments = transcription.get("agent_segments", [])
            customer_segments = transcription.get("customer_segments", [])

            if not segments:
                logger.warning(f"No segments extracted for call_id={call_id}")
            
            logger.info(f"Step 1 complete: Transcription in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=1 error={e}")
            segments, agent_segments, customer_segments = [], [], []

        # 2. Sentiment Analysis
        try:
            t_start = time.time()
            if not analyze_sentiment: raise Exception("Sentiment module unavailable")
            sent_data, sent_arc, sent_avg, recovery_index = await asyncio.to_thread(analyze_sentiment, segments)
            analysis_data["sentiment_scores"] = sent_data
            analysis_data["sentiment_arc"] = sent_arc
            analysis_data["recovery_index"] = recovery_index
            scores["sentiment_avg"] = sent_avg
            logger.info(f"Step 2 complete: Sentiment = {sent_avg:.1f} in {int((time.time() - t_start)*1000)}ms | recovery_at={recovery_index}")
        except Exception as e:
            logger.error(f"Pipeline error: step=2 error={e}")
            scores["sentiment_avg"] = 0.0
            analysis_data["recovery_index"] = None

        # 3. Tone & Emotion
        try:
            t_start = time.time()
            if not analyze_tone: raise Exception("Tone module unavailable")
            tone_data = await asyncio.to_thread(analyze_tone, agent_segments)
            analysis_data["tone_labels"] = tone_data
            scores["empathy_score"] = tone_data.get("empathy_score", 0.0)
            logger.info(f"Step 3 complete: Tone = {scores['empathy_score']:.1f} in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=3 error={e}")
            scores["empathy_score"] = 0.0

        # 4. Clarity
        try:
            t_start = time.time()
            agent_text = " ".join(agent_segments)
            duration = call.duration_seconds if call.duration_seconds else 60
            if not analyze_clarity: raise Exception("Clarity module unavailable")
            clarity_data = await asyncio.to_thread(analyze_clarity, agent_text, duration / 60)
            
            analysis_data.update(clarity_data)
            scores["clarity_score"] = clarity_data.get("clarity_score", 0.0)
            logger.info(f"Step 4 complete: Clarity = {scores['clarity_score']:.1f} in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=4 error={e}")
            scores["clarity_score"] = 0.0

        # 5. Compliance
        try:
            t_start = time.time()
            agent_text = " ".join(agent_segments)
            if not check_compliance: raise Exception("Compliance module unavailable")
            comp_score, comp_flags = await asyncio.to_thread(check_compliance, agent_text)
            analysis_data["compliance_flags"] = comp_flags
            analysis_data["compliance_score"] = comp_score
            scores["compliance_score"] = comp_score
            logger.info(f"Step 5 complete: Compliance = {comp_score:.1f} in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=5 error={e}")
            scores["compliance_score"] = 0.0

        # 6. Resolution
        try:
            t_start = time.time()
            if not analyze_resolution: raise Exception("Resolution module unavailable")
            res_score = await asyncio.to_thread(analyze_resolution, " ".join(customer_segments), " ".join(agent_segments))
            analysis_data["resolution_quality"] = res_score
            scores["resolution_score"] = res_score
            logger.info(f"Step 6 complete: Resolution = {res_score:.1f} in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=6 error={e}")
            scores["resolution_score"] = 0.0

        # 7. Language
        try:
            t_start = time.time()
            if not analyze_language: raise Exception("Language module unavailable")
            lang_score = await asyncio.to_thread(analyze_language, agent_segments)
            analysis_data["language_score"] = lang_score
            scores["language_score"] = lang_score
            logger.info(f"Step 7 complete: Language = {lang_score:.1f} in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=7 error={e}")
            analysis_data["language_score"] = 0.0
            scores["language_score"] = 0.0

        # 8. Ollama LLM Summary
        try:
            t_start = time.time()
            if not generate_coaching_summary: raise Exception("Ollama module unavailable")
            compliance_flags = analysis_data.get("compliance_flags", [])
            summary = await generate_coaching_summary(
                " ".join(agent_segments),
                scores=scores,
                compliance_flags=compliance_flags,
            )
            analysis_data["llm_summary"] = summary or {}
            logger.info(f"Step 8 complete: Ollama Summary in {int((time.time() - t_start)*1000)}ms")
        except Exception as e:
            logger.error(f"Pipeline error: step=8 error={e}")

        # 9. Scoring Engine
        try:
            if calculate_composite_score:
                composite = calculate_composite_score(scores)
            else:
                valid_scores = [v for v in scores.values() if isinstance(v, (int, float))]
                composite = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
            analysis_data["composite_score"] = composite
            scores["composite_score"] = composite
            logger.info(f"Step 9 complete: Composite = {composite:.1f}")
        except Exception as e:
            logger.error(f"Pipeline error: step=9 error={e}")
            analysis_data["composite_score"] = 0.0
            scores["composite_score"] = 0.0

        # 10. Save Results
        try:
            total_time_ms = int((time.time() - start_time) * 1000)
            llm_summary = analysis_data.get("llm_summary") or {}
            llm_summary["recovery_index"] = analysis_data.get("recovery_index")
            analysis_data["llm_summary"] = llm_summary
            
            analysis_result = AnalysisResult(
                call_id=call_id,
                sentiment_scores=analysis_data.get("sentiment_scores", []),
                sentiment_arc=analysis_data.get("sentiment_arc", []),
                tone_labels=analysis_data.get("tone_labels", {}),
                clarity_score=analysis_data.get("clarity_score", 0.0),
                filler_word_count=analysis_data.get("filler_word_count", 0),
                speaking_pace=analysis_data.get("speaking_pace", 0.0),
                compliance_flags=analysis_data.get("compliance_flags", []),
                compliance_score=analysis_data.get("compliance_score", 0.0),
                resolution_quality=analysis_data.get("resolution_quality", 0.0),
                language_score=analysis_data.get("language_score", 0.0),
                composite_score=analysis_data.get("composite_score", 0.0),
                llm_summary=analysis_data.get("llm_summary", {}),
                processing_time_ms=total_time_ms,
                model_versions={"whisper": get_settings().WHISPER_MODEL_SIZE}
            )
            db.add(analysis_result)
            
            call.status = "complete"
            await db.commit()
            
            # Generate PDF (fire and forget for this script)
            analysis_dict = analysis_data.copy()
            analysis_dict["sentiment_avg"] = scores.get("sentiment_avg", 0.0)
            analysis_dict["empathy_score"] = scores.get("empathy_score", 0.0)
            if generate_pdf_report:
                await asyncio.to_thread(generate_pdf_report, analysis_dict, str(call_id))
            
            logger.info(f"Pipeline complete: call_id={call_id} composite={analysis_data['composite_score']:.1f} total={total_time_ms}ms")
        except Exception as e:
            await db.rollback()
            logger.error(f"Pipeline error in Step 10: {e}")
            call.status = "failed"
            db.add(call)
            await db.commit()

