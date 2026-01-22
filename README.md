# AI Image Colorizer (FastAPI + React)

A full-stack AI-powered image enhancement + colorization project.

✅ Upload an image  
✅ Choose a processing mode:
  - Enhance Only
  - Colorize Only (AI)
  - Enhance + Colorize

✅ Get 3 output variants  
✅ Download results  
✅ Delete generated files (privacy + storage)

---

## Tech Stack

### Backend
- Python
- FastAPI
- Uvicorn
- OpenCV (for enhancement + AI colorization pipeline)
- NumPy

### Frontend
- React (Vite)
- Axios

---

## Project Structure

```text
AI-colorizer/
├── app/                     # FastAPI backend logic
│   ├── main.py              # API entry
│   ├── pipeline.py          # decides which mode to run
│   ├── enhance.py           # enhancement variants
│   ├── colorize.py          # AI colorization
│   └── storage.py           # upload/output paths + delete
│
├── uploads/                 # uploaded files (generated)
├── outputs/                 # output variants (generated)
│
├── models/
│   └── colorization/        # local AI weights (NOT committed)
│
└── frontend/                # React frontend
```

---

## Requirements

### Software Needed
- Python 3.10+ (recommended)
- Node.js 18+ (recommended)
- Git

---

# Setup Instructions (Fresh Clone)

### 1) Clone the repo
```powershell
git clone "https://github.com/KrucibleCoder/AI-colorizer.git"
cd AI-colorizer
```

### Backend Setup (FastAPI)
### 2) Create and activate virtual environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
If activation is blocked due to execution policy:
- Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

### 3) Install Python dependencies
```powershell
pip install fastapi uvicorn python-multipart pillow opencv-python numpy
```

#### Model Setup (IMPORTANT)
 - This project uses OpenCV DNN colorization weights.
 - These model files are NOT committed to GitHub (they are ignored in .gitignore).

### 4) Create models folder
```powershell
mkdir models
mkdir models\colorization
```

### 5) Download the model files and place them here:
#### Put these 3 files into:
- models/colorization/

#### Required files:
- colorization_deploy_v2.prototxt
- colorization_release_v2.caffemodel
- pts_in_hull.npy

Final result must look like:
```text
models/colorization/colorization_deploy_v2.prototxt
models/colorization/colorization_release_v2.caffemodel
models/colorization/pts_in_hull.npy
```
#### ⚠️ If these files are missing, Colorize mode will fail.

### 6) Run the backend
From repo root:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend URL:
- http://127.0.0.1:8000

Swagger docs:
- http://127.0.0.1:8000/docs

## Frontend Setup (React)
### 7) Install frontend dependencies
Open a NEW terminal in the repo root:

```powershell
cd frontend
npm install
```

### 8) Start frontend
```powershell
npm run dev
```

Frontend URL:

http://localhost:5173

## How to Use:
Open the frontend in your browser:

1. http://localhost:5173
2. Upload an image
3. Select one of the modes:
   - Enhance Only
   - Colorize Only
   - Enhance + Colorize
4. Click Generate Variants
5. Preview and download results
6. Use Delete All to remove generated files

API Endpoints:
1) POST /api/upload?mode=enhance|colorize|both
   - Uploads an image and returns output URLs.

    Example response:
    ```text
    {
      "message": "Upload successful",
      "mode": "colorize",
      "original": "/uploads/example.jpg",
      "variants":
    [
        "/outputs/example_colorize1.jpg",
        "/outputs/example_colorize2.jpg",
        "/outputs/example_colorize3.jpg"
      ]
    }
    ```

2) DELETE /api/delete_all
   - Deletes everything from:
     - /uploads
     - /outputs

### Notes About Large Files (IMPORTANT)
Model weight files are ignored and should never be committed.

### Your .gitignore includes:

- .venv/
- frontend/node_modules/
- models/colorization/*.prototxt
- models/colorization/*.caffemodel
- models/colorization/*.npy

## Common Issues
Frontend says: "Upload failed. Check backend is running."

## Fix:

### Make sure backend is running at:

http://127.0.0.1:8000

Ensure FastAPI has CORS enabled for:

http://localhost:5173

## Colorize mode crashes / doesn't work
### Cause:
Missing model files.

### Fix:
Make sure the 3 required files exist inside:

models/colorization/

---
# Future Improvements

1. Higher quality AI colorization model (DeOldify / diffusion)
2. Better multi-variant generation (real variety)
3. Session-based deletion for multi-user hosting
4. Batch processing
5. Offline EXE / APK packaging

---
# License

Add your license here (MIT recommended for open source).
