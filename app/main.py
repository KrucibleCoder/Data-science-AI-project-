from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uuid

from app.storage import UPLOAD_DIR, OUTPUT_DIR, clear_storage
from app.pipeline import process_image

app = FastAPI(title="AI Image Colorizer API")

# ✅ CORS for React frontend (Vite usually runs on 5173)
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

# Serve uploads and outputs so they can be opened in browser
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend running"}


@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    mode: str = Query("enhance")
):
    ext = Path(file.filename).suffix.lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        return {"error": "Unsupported file type. Use png/jpg/jpeg/webp."}

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    # Save file to disk
    contents = await file.read()
    save_path.write_bytes(contents)

    # Create variants based on selected mode
    variant_paths = process_image(save_path, OUTPUT_DIR, mode)

    # Return public URLs
    variants = [f"/outputs/{p.name}" for p in variant_paths]

    return {
        "message": "Upload successful",
        "mode": mode,
        "original": f"/uploads/{save_path.name}",
        "variants": variants
    }


@app.delete("/api/delete_all")
def delete_all():
    clear_storage()
    return {"message": "All uploads and outputs deleted."}
