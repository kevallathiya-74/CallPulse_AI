import os
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from app.core.config import get_settings

settings = get_settings()

def generate_pdf_report(analysis_data: dict, call_id: str) -> str:
    """
    Minimal mock PDF generation for CallPulse AI report.
    Returns path to the generated PDF.
    """
    export_dir = settings.EXPORT_DIR
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
        
    filename = f"report_{call_id}.pdf"
    filepath = os.path.join(export_dir, filename)
    
    try:
        c = canvas.Canvas(filepath, pagesize=letter)
        c.drawString(100, 750, "CallPulse AI Quality Report")
        c.drawString(100, 730, f"Call ID: {call_id}")
        
        c.drawString(100, 690, "Scores:")
        c.drawString(120, 670, f"Composite Score: {analysis_data.get('composite_score', 0)}")
        c.drawString(120, 650, f"Sentiment: {analysis_data.get('sentiment_avg', 0)}")
        c.drawString(120, 630, f"Empathy: {analysis_data.get('empathy_score', 0)}")
        c.drawString(120, 610, f"Clarity: {analysis_data.get('clarity_score', 0)}")
        c.drawString(120, 590, f"Compliance: {analysis_data.get('compliance_score', 0)}")
        c.drawString(120, 570, f"Resolution: {analysis_data.get('resolution_score', 0)}")
        
        c.drawString(100, 530, "Coaching Summary:")
        summary = analysis_data.get('llm_summary', {}).get("summary", "N/A")
        c.drawString(120, 510, summary[:100] + "...")  # Simplified, use proper wrapping in production
        
        c.save()
        return filepath
    except Exception as e:
        import loguru
        loguru.logger.error(f"PDF generation failed: {e}")
        return ""
