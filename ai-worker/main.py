import os
import shutil
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

from parse import parse_yolo_results, parse_whisper_transcript


app = FastAPI(title="FieldSync AI Worker Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YOLO_MODEL_PATH = os.path.join(BASE_DIR, "yolo11n.pt")

# Avoid Ultralytics writing to /root
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"

print("Loading YOLO11 Nano model...")
yolo_model = YOLO(YOLO_MODEL_PATH)

# Whisper loaded lazily on first audio request
whisper_model = None


def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        print("Loading OpenAI Whisper Tiny...")
        import whisper
        whisper_model = whisper.load_model("tiny")
    return whisper_model


# =====================================================
# RESPONSE SCHEMAS
# =====================================================

class AISuggestion(BaseModel):
    suggestion_type: str           # 'vision' | 'voice' | 'combined'
    model_name: str
    confidence: float              # 0.0 - 1.0
    suggested_pct_complete: Optional[float] = None  # 0-100, if determinable
    suggested_notes: Optional[str] = None
    raw_output: dict
    verified: bool


# =====================================================
# HEALTH
# =====================================================

@app.get("/")
async def root():
    return {
        "service": "FieldSync AI Worker",
        "status": "running",
        "endpoints": ["/analyze", "/suggest", "/health"],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


# =====================================================
# /analyze — Original endpoint (direct result)
# =====================================================

@app.post("/analyze")
async def analyze(
    image: UploadFile = File(None),
    audio: UploadFile = File(None),
):
    results = {
        "vision_analysis": [],
        "voice_transcript": None,
        "verified": True,
    }

    if image:
        suffix = os.path.splitext(image.filename or "image.jpg")[1] or ".jpg"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                temp_path = tmp.name
                shutil.copyfileobj(image.file, tmp)
            yolo_out = yolo_model(temp_path)
            results["vision_analysis"] = parse_yolo_results(yolo_out)
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    if audio:
        suffix = os.path.splitext(audio.filename or "audio.wav")[1] or ".wav"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                temp_path = tmp.name
                shutil.copyfileobj(audio.file, tmp)
            model = get_whisper_model()
            transcription = model.transcribe(temp_path)
            results["voice_transcript"] = parse_whisper_transcript(
                transcription.get("text", "")
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    return results


# =====================================================
# /suggest — Human-in-the-loop approval queue flow
#
# Returns a structured AISuggestion that the Express
# backend stores in ai_suggestions table for manager
# review. Nothing is auto-applied to the project.
# =====================================================

@app.post("/suggest", response_model=AISuggestion)
async def suggest(
    image: UploadFile = File(None),
    audio: UploadFile = File(None),
    context: str = Form(None),  # JSON string with activityId, currentPct, etc.
):
    vision_results = []
    transcript_text = None
    model_name = "none"
    confidence = 0.0

    # --- IMAGE ANALYSIS ---
    if image:
        model_name = "yolo11n"
        suffix = os.path.splitext(image.filename or "image.jpg")[1] or ".jpg"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                temp_path = tmp.name
                shutil.copyfileobj(image.file, tmp)
            yolo_out = yolo_model(temp_path)
            vision_results = parse_yolo_results(yolo_out)
            # Derive confidence from top detection
            if vision_results:
                avg_conf = sum(
                    d.get("confidence", 0) for d in vision_results
                ) / len(vision_results)
                confidence = round(avg_conf, 3)
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    # --- AUDIO ANALYSIS ---
    if audio:
        model_name = "whisper-tiny" if not image else "yolo11n+whisper-tiny"
        suffix = os.path.splitext(audio.filename or "audio.wav")[1] or ".wav"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                temp_path = tmp.name
                shutil.copyfileobj(audio.file, tmp)
            whisper_m = get_whisper_model()
            transcription = whisper_m.transcribe(temp_path)
            raw_text = transcription.get("text", "").strip()
            transcript_text = parse_whisper_transcript(raw_text)
            if not image:
                confidence = 0.75  # fixed confidence for voice-only
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    # --- BUILD SUGGESTION ---
    # Try to extract a percentage from the transcript (simple heuristic)
    suggested_pct = None
    if transcript_text:
        import re
        pct_match = re.search(r'\b(\d{1,3})\s*(?:%|percent)\b', transcript_text, re.IGNORECASE)
        if pct_match:
            val = int(pct_match.group(1))
            if 0 <= val <= 100:
                suggested_pct = float(val)

    raw_output = {
        "vision_detections": vision_results,
        "voice_transcript": transcript_text,
        "context": context,
    }

    return AISuggestion(
        suggestion_type="combined" if (image and audio) else ("vision" if image else "voice"),
        model_name=model_name,
        confidence=confidence,
        suggested_pct_complete=suggested_pct,
        suggested_notes=transcript_text,
        raw_output=raw_output,
        verified=False,  # always False — requires manager approval
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
