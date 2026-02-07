"""
main.py
========
Entry point for the FastAPI backend of the AI Image Colorizer project.

Responsibilities of this file:
- API setup and configuration
- CORS configuration for frontend communication
- Static file serving (uploads / outputs)
- Image upload and processing routing
- Feedback collection (NLP-based sentiment analysis)
- User satisfaction analytics (graph generation)
"""

# -----------------------------
# Core FastAPI imports
# -----------------------------
from fastapi import FastAPI, UploadFile, File, Query, Body
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

# -----------------------------
# Internal application modules
# -----------------------------
from app.storage import UPLOAD_DIR, OUTPUT_DIR, clear_storage
from app.pipeline import process_image
from app.feedback_nlp import analyze_feedback
from app.review_analytics import generate_satisfaction_graph


# =============================================================================
# FastAPI application initialization
# =============================================================================
app = FastAPI(
    title="AI Image Colorizer API",
    description="Backend API for image enhancement, colorization, and user feedback analytics",
    version="1.0.0"
)

# =============================================================================
# CORS CONFIGURATION
# Allows React frontend (Vite) to communicate with this backend
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
# These directories are exposed so the frontend can preview and download images
# =============================================================================
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


# =============================================================================
# HEALTH CHECK / ROOT ENDPOINT
# Used to verify backend is running
# =============================================================================
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Backend running"
    }


# =============================================================================
# IMAGE UPLOAD + PROCESSING ENDPOINT
# Handles:
# - image upload
# - mode selection (enhance | colorize | both)
# - processing pipeline execution
# - returning public URLs for generated variants
# =============================================================================
@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    mode: str = Query("enhance", description="Processing mode: enhance | colorize | both")
):
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        return {
            "error": "Unsupported file type. Use png, jpg, jpeg, or webp."
        }

    # Generate a unique filename to avoid collisions
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    # Persist uploaded file to disk
    contents = await file.read()
    save_path.write_bytes(contents)

    # Run processing pipeline based on selected mode
    variant_paths = process_image(save_path, OUTPUT_DIR, mode)

    # Convert filesystem paths into public URLs
    variants = [f"/outputs/{p.name}" for p in variant_paths]

    return {
        "message": "Upload successful",
        "mode": mode,
        "original": f"/uploads/{save_path.name}",
        "variants": variants
    }


# =============================================================================
# STORAGE CLEANUP ENDPOINT
# Deletes all uploaded and generated files (privacy + disk cleanup)
# =============================================================================
@app.delete("/api/delete_all")
def delete_all():
    clear_storage()
    return {
        "message": "All uploads and outputs deleted."
    }


# =============================================================================
# USER FEEDBACK SUBMISSION ENDPOINT
# Handles:
# - free-text user feedback
# - sentiment analysis (TextBlob + NLTK)
# - private storage of review data (gitignored)
# =============================================================================
@app.post("/api/feedback")
async def submit_feedback(payload: dict = Body(...)):
    """
    Expected payload structure:
    {
        "session_id": "...",
        "best_variant": "...",
        "worst_variant": "...",
        "feedback": "user free text"
    }
    """

    # Run NLP sentiment analysis on user feedback
    analysis = analyze_feedback(payload["feedback"])

    # Construct review record
    record = {
        "session_id": payload["session_id"],
        "best_variant": payload["best_variant"],
        "worst_variant": payload["worst_variant"],
        "feedback": payload["feedback"],
        "sentiment": analysis,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Ensure Reviews directory exists (tracked, but data ignored)
    reviews_dir = Path("Reviews")
    reviews_dir.mkdir(exist_ok=True)

    # Append review as JSON Lines (safe for incremental writes)
    with open(reviews_dir / "reviews.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    return {
        "message": "Feedback stored successfully",
        "sentiment": analysis
    }


# =============================================================================
# USER SATISFACTION ANALYTICS ENDPOINT
# Returns:
# - PNG image generated by matplotlib
# - demo data if no real reviews exist
# Frontend simply displays this image
# =============================================================================
@app.get("/api/reviews/summary")
def review_summary():
    image_bytes = generate_satisfaction_graph()
    return Response(
        content=image_bytes,
        media_type="image/png"
    )


# =============================================================================
# DIRECT EXECUTION ENTRY POINT
# Required for PyInstaller / EXE builds
# =============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False
    )