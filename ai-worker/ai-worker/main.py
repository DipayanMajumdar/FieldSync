import os
import shutil
import tempfile

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import whisper

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

print("Loading YOLO11 Nano model...")
yolo_model = YOLO(YOLO_MODEL_PATH)

# Whisper tiny is much lighter and more suitable for a prototype/free cloud instance.
print("Loading OpenAI Whisper Tiny...")
whisper_model = whisper.load_model("tiny")


@app.get("/")
async def root():
    return {
        "service": "FieldSync AI Worker",
        "status": "running",
        "endpoint": "/analyze",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


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

            transcription = whisper_model.transcribe(temp_path)
            results["voice_transcript"] = parse_whisper_transcript(
                transcription.get("text", "")
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    return results


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
