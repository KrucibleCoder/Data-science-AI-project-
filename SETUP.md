# AI Image Colorizer
**FastAPI + React | AI Enhancement, Colorization & Analytics**

A full-stack AI-powered image enhancement and colorization system featuring user feedback analytics, NLP-based sentiment analysis, and a token-protected developer diagnostics dashboard.

> **Note:** Advanced NLP and Developer features (NLTK, TextBlob, and the Dashboard) are available on the **demo branch**.

---

## 🚀 Features

### User Features
* **Image Processing:** Upload PNG, JPG, or WEBP.
* **Multiple Modes:**
  * Enhance Only
  * Colorize Only (AI)
  * Enhance + Colorize
* **Variant Generation:** Automatically generates multiple output variants for comparison.
* **Batch Management:** Preview individual variants, download all as a ZIP, or delete files to maintain privacy.
* **Feedback Loop:** Slider-based user feedback per variant and public satisfaction visualization.

### Developer Features (Demo Branch)
* **NLP Feedback Analysis:** Sentiment polarity, subjectivity, and keyword extraction using NLTK and TextBlob.
* **Diagnostics Dashboard:** A hidden, token-protected UI for variant-level diagnostics.
* **Reporting:** Auto-generated PNG analytics reports and developer-only APIs.

---

## 🛠 Tech Stack

### Backend
* **Core:** Python 3.12+, FastAPI, Uvicorn
* **Processing:** OpenCV, NumPy
* **Analytics/NLP:** Matplotlib, NLTK, TextBlob

### Frontend
* **Core:** React (Vite)
* **Networking:** Axios
* **Utilities:** React Router, JSZip

---

## 📁 Project Structure

```text
AI-colorizer/
├── app/                     # Backend Logic
│   ├── main.py              # API Entry Point
│   ├── pipeline.py          # Processing Orchestrator
│   ├── enhance.py           # Image Enhancement
│   ├── colorize.py          # AI Colorization
│   ├── storage.py           # File System Management
│   ├── feedback_nlp.py      # NLP Analysis (Demo)
│   ├── review_analytics.py  # Data Processing
│   └── dev_analytics.py     # Report Generation
│
├── Reviews/                 # Feedback Data (gitignored)
├── uploads/                 # Source Images (gitignored)
├── outputs/                 # Processed Images (gitignored)
│
├── models/
│   └── colorization/        # AI Weights
│
└── frontend/                # React Vite Project
    └── src/pages/DevDashboard.jsx

```

---

## ⚙️ Setup Instructions

### 1. Clone Repository & Select Branch

```powershell
git clone [https://github.com/KrucibleCoder/AI-colorizer.git](https://github.com/KrucibleCoder/AI-colorizer.git)
cd AI-colorizer

# Switch to demo branch for NLP/Analytics features
git checkout demo

```

### 2. Backend Environment Setup

```powershell
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# If execution is blocked, run:
# Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

```

### 3. Install Dependencies

```powershell
pip install fastapi uvicorn python-multipart pillow opencv-python numpy matplotlib nltk textblob

# Download required NLP corpora
python -m textblob.download_corpora

```

### 4. AI Model Setup (CRITICAL)

The project uses OpenCV DNN colorization weights. These files are **ignored** by git and must be downloaded manually.

**Create the directory:**

```powershell
mkdir models
mkdir models\colorization

```

**Download the 3 required files:**
Run these commands in PowerShell to place them in `models/colorization/`:

```powershell
Invoke-WebRequest -Uri "[https://raw.githubusercontent.com/richzhang/colorization/caffe/models/colorization_deploy_v2.prototxt](https://raw.githubusercontent.com/richzhang/colorization/caffe/models/colorization_deploy_v2.prototxt)" -OutFile "models/colorization/colorization_deploy_v2.prototxt"

Invoke-WebRequest -Uri "[https://raw.githubusercontent.com/richzhang/colorization/caffe/resources/pts_in_hull.npy](https://raw.githubusercontent.com/richzhang/colorization/caffe/resources/pts_in_hull.npy)" -OutFile "models/colorization/pts_in_hull.npy"

Invoke-WebRequest -Uri "[https://www.dropbox.com/scl/fi/d8zffur3wmd4wet58dp9x/colorization_release_v2.caffemodel?dl=1](https://www.dropbox.com/scl/fi/d8zffur3wmd4wet58dp9x/colorization_release_v2.caffemodel?dl=1)" -OutFile "models/colorization/colorization_release_v2.caffemodel"

```

> **Verify:** Ensure `colorization_release_v2.caffemodel` is ~128MB. If it is 0KB, download it manually from the Dropbox link.

### 5. Developer Token Setup

Set the security token for the hidden dashboard.
*Restart your terminal after running this command.*

```powershell
setx DEV_DASHBOARD_TOKEN "demo-dev-token_00"

```

---

## 🏃 Running the Application

### Start Backend (FastAPI)

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

```

* **API Docs:** http://127.0.0.1:8000/docs
* **API Base:** http://127.0.0.1:8000

### Start Frontend (React)

Open a **new** terminal window:

```powershell
cd frontend
npm install
npm install react-router-dom
npm run dev

```

* **User Interface:** http://localhost:5173
* **Developer Dashboard:** http://localhost:5173/__dev/dashboard

---

## ⚠️ Common Issues & Troubleshooting

**1. "Upload failed. Check backend is running."**

* Ensure FastAPI is running on port 8000.
* Ensure CORS is enabled in `main.py` for `http://localhost:5173`.

**2. Colorize mode crashes**

* 99% of the time, this is missing model files.
* Check that `models/colorization/` contains all 3 files: `.prototxt`, `.caffemodel`, and `.npy`.

**3. Developer Dashboard Access Denied**

* Ensure you ran the `setx` command for the token.
* Ensure you restarted the terminal (and VS Code) so the environment variable loads.

---

## 📜 License

This project utilizes pretrained assets from **Colorful Image Colorization (ECCV 2016)** by Richard Zhang, Phillip Isola, and Alexei A. Efros.

* **License:** BSD-2-Clause
