"""
main.py
========
Entry point for the FastAPI backend of the AI Image Colorizer project.

Responsibilities:
- API setup and configuration
- CORS configuration for frontend communication
- Static file serving (uploads / outputs)
- Image upload and processing routing
- Slider-based user feedback collection
- NLP sentiment analysis on comments
- User satisfaction analytics (matplotlib pie chart)
- Developer-only analytics and reporting (token-protected)
"""

# -----------------------------
# Core FastAPI imports
# -----------------------------
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Query,
    Body,
    Header,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response

# -----------------------------
# Standard library imports
# -----------------------------
from pathlib import Path
from datetime import datetime
import uuid
import json
import os

# -----------------------------
# Internal application modules
# -----------------------------
from app.storage import UPLOAD_DIR, OUTPUT_DIR, clear_storage
from app.pipeline import process_image
from app.feedback_nlp import analyze_feedback
from app.review_analytics import generate_satisfaction_pie
from app.dev_analytics import analyze_reviews, generate_dev_report_png


# =============================================================================
# FastAPI application initialization
# =============================================================================
app = FastAPI(
    title="AI Image Colorizer API",
    description="Backend API for image enhancement, colorization, and user feedback analytics",
    version="1.2.0",
)

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# STATIC FILE SERVING
# =============================================================================
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


# =============================================================================
# DEV TOKEN SECURITY (LIGHTWEIGHT, NO ACCOUNTS)
# =============================================================================
DEV_TOKEN = os.getenv("DEV_DASHBOARD_TOKEN")


def verify_dev_token(x_dev_token: str = Header(None)):
    if DEV_TOKEN is None:
        raise HTTPException(
            status_code=403,
            detail="Developer dashboard disabled",
        )

    if x_dev_token != DEV_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Invalid developer token",
        )


# =============================================================================
# ROOT / HEALTH CHECK
# =============================================================================
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Backend running",
    }


# =============================================================================
# IMAGE UPLOAD + PROCESSING
# =============================================================================
@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    mode: str = Query(
        "enhance",
        description="Processing mode: enhance | colorize | both",
    ),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        return {
            "error": "Unsupported file type. Use png, jpg, jpeg, or webp."
        }

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    contents = await file.read()
    save_path.write_bytes(contents)

    variant_paths = process_image(save_path, OUTPUT_DIR, mode)
    variants = [f"/outputs/{p.name}" for p in variant_paths]

    return {
        "message": "Upload successful",
        "mode": mode,
        "original": f"/uploads/{save_path.name}",
        "variants": variants,
    }


# =============================================================================
# STORAGE CLEANUP
# =============================================================================
@app.delete("/api/delete_all")
def delete_all():
    clear_storage()
    return {
        "message": "All uploads and outputs deleted."
    }


# =============================================================================
# SLIDER-BASED USER REVIEW SUBMISSION
# =============================================================================
@app.post("/api/reviews")
async def submit_review(payload: dict = Body(...)):
    """
    Expected payload:
    {
        "image": "http://127.0.0.1:8000/outputs/xyz.jpg",
        "label": "Natural",
        "score": 78,
        "comment": "Optional user feedback"
    }
    """

    reviews_dir = Path("Reviews")
    reviews_dir.mkdir(exist_ok=True)
    reviews_file = reviews_dir / "reviews.jsonl"

    score = max(0, min(100, int(payload.get("score", 0))))
    label = payload.get("label", "Unknown")
    comment = payload.get("comment", "")

    sentiment = analyze_feedback(comment)

    record = {
        "label": label,
        "score": score,
        "sentiment": sentiment,
        "timestamp": datetime.utcnow().isoformat(),
    }

    with open(reviews_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    return {
        "message": "Review recorded",
        "sentiment": sentiment,
    }


# =============================================================================
# USER SATISFACTION ANALYTICS (PUBLIC)
# =============================================================================
@app.get("/api/reviews/summary")
def review_summary():
    image_bytes = generate_satisfaction_pie()
    return Response(
        content=image_bytes,
        media_type="image/png",
    )


# =============================================================================
# DEVELOPER ANALYTICS (TOKEN-PROTECTED)
# =============================================================================
@app.get("/api/dev/analytics")
def dev_analytics(_: None = Depends(verify_dev_token)):
    """
    Returns structured NLP + score analytics for developer inspection.
    """
    return analyze_reviews()


@app.get("/api/dev/report")
def dev_report(_: None = Depends(verify_dev_token)):
    """
    Returns a PNG report summarizing review analytics.
    """
    image_bytes = generate_dev_report_png()
    return Response(
        content=image_bytes,
        media_type="image/png",
    )


# =============================================================================
# DIRECT EXECUTION (FOR EXE BUILDS)
# =============================================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )
