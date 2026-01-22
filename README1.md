# AI Image Colorizer (FastAPI + React)

A full-stack AI-powered image **enhancement + colorization** web app.

Upload a black-and-white (or dull/old) photo, pick a mode, and get multiple output variants to preview and download.

---

## ✨ Features

- Upload an image (PNG/JPG/JPEG/WEBP)
- Choose a processing mode:
  - **Enhance Only** (denoise + contrast + sharpen variants)
  - **Colorize Only (AI)** (OpenCV DNN colorization)
  - **Enhance + Colorize** (restoration then colorization)
- Generates **3 output variants**
- Preview + download results
- One-click delete to remove generated files (privacy + storage)

---

## 🧠 How It Works (High Level)

1. Frontend uploads an image to FastAPI backend  
2. Backend stores it in `/uploads`
3. Pipeline runs based on selected mode:
   - Enhance → generates 3 enhanced variants
   - Colorize → generates AI-colorized output
   - Both → enhances first, then colorizes
4. Outputs are saved to `/outputs` and served as public URLs
5. Frontend displays original + variants for preview/download

---

## 🛠 Tech Stack

### Backend
- Python
- FastAPI + Uvicorn
- OpenCV + NumPy (enhancement + AI colorization pipeline)

### Frontend
- React (Vite)
- Axios

---

## 📦 Project Structure

```
AI-colorizer/
│
├── app/
│   ├── main.py         # FastAPI API entry + routes
│   ├── pipeline.py     # decides which mode to run
│   ├── enhance.py      # enhancement variant generator
│   ├── colorize.py     # AI colorization (OpenCV DNN)
│   └── storage.py      # paths + delete utilities
│
├── uploads/            # generated uploads (ignored)
├── outputs/            # generated outputs (ignored)
│
├── models/
│   └── colorization/   # local model files (ignored)
│
└── frontend/           # React frontend
```

---

## 🚀 Quickstart

### 1) Backend (FastAPI)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:
- http://127.0.0.1:8000  
Swagger docs:
- http://127.0.0.1:8000/docs  

### 2) Frontend (React)
```powershell
cd frontend
npm install
npm run dev
```

Frontend:
- http://localhost:5173

---

## 🧩 Model Setup (Important)

This project uses OpenCV DNN colorization weights.

✅ These files are required locally:

```
models/colorization/colorization_deploy_v2.prototxt
models/colorization/colorization_release_v2.caffemodel
models/colorization/pts_in_hull.npy
```

⚠️ Model files are **NOT committed to GitHub** (intentionally ignored due to size).

---

## 🔌 API Overview

### Upload + process
`POST /api/upload?mode=enhance|colorize|both`

Returns:
- original image URL
- variant image URLs

### Delete generated files
`DELETE /api/delete_all`

Clears:
- `/uploads`
- `/outputs`

---

## 🛣 Roadmap / Future Improvements

- Better colorization models (DeOldify / diffusion)
- Real diversity across generated variants (not just post-processing)
- Session-based deletion for multi-user hosting
- Batch processing for multiple images
- Offline builds (EXE / APK)

---

## 📄 Setup Guide

For full setup, troubleshooting, and notes:
✅ See `SETUP.md`

---

## 📜 License

MIT (recommended)  
Add your license here.
