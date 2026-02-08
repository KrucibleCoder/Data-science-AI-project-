# AI Image Colorizer

**FastAPI + React | Image Enhancement, Colorization, and Feedback Analytics**

A full-stack, offline-capable AI application for **image enhancement and colorization**, featuring **user feedback analysis with NLP-driven developer analytics**.

Upload a black-and-white or low-quality image, generate multiple variants, review the results, and analyze user satisfaction through structured data science workflows.

---

## ✨ Features

### Image Processing

* Upload images (PNG, JPG, JPEG, WEBP)
* Three processing modes:

  * **Enhance Only**
    Denoising, contrast correction, sharpening (multiple variants)
  * **Colorize Only (AI)**
    OpenCV DNN-based image colorization
  * **Enhance + Colorize**
    Restoration followed by AI colorization
* Generates **multiple output variants**
* Preview and download individual images or ZIP
* One-click deletion of generated files (privacy-first)

### User Feedback & Analytics

* Per-variant **slider-based ratings (0–100)**
* Optional free-text feedback
* NLP-powered sentiment analysis using:

  * **NLTK**
  * **TextBlob**
* Aggregated **user satisfaction visualization**
* Developer-only analytics dashboard
* Auto-generated analytics reports (PNG)

---

## 🧠 How It Works (High Level)

1. User uploads an image via the React frontend
2. FastAPI backend stores it in `/uploads`
3. Processing pipeline executes based on selected mode:

   * Enhancement
   * Colorization
   * Enhancement → Colorization
4. Output variants are saved in `/outputs` and served as static URLs
5. User previews results and provides feedback
6. Backend performs:

   * Numeric aggregation (scores, variance)
   * Sentiment analysis (polarity, subjectivity)
   * Keyword extraction
7. Developer analytics and reports are generated from collected data

---

## 🧪 Feedback & NLP Pipeline

User feedback is intentionally split into **two layers**:

### User-facing

* Simple sliders for satisfaction
* Optional comment
* No exposure to analytics or sentiment data

### Developer-facing

* Aggregated statistics per variant:

  * Average score
  * Variance (user disagreement)
  * Review count
* NLP insights:

  * Sentiment polarity & subjectivity
  * Frequent keywords
* Automatic observations (non-blocking):

  * Common complaints
  * Inconsistent user responses
* Visual developer reports (PNG)

This mirrors **real-world ML evaluation pipelines**, where qualitative feedback informs model iteration without affecting user experience.

---

## 🔐 Developer Analytics Security

Developer analytics endpoints are **not publicly accessible**.

Security model:

* Backend bound to `127.0.0.1`
* Token-based access via environment variable:

  ```
  DEV_DASHBOARD_TOKEN
  ```
* No accounts, no database authentication
* No frontend exposure by default

This approach keeps analytics private while remaining lightweight and offline-friendly.

---

## 🛠 Tech Stack

### Backend

* Python 3.12+
* FastAPI + Uvicorn
* OpenCV (image processing + DNN colorization)
* NumPy
* Matplotlib (analytics & reports)
* NLTK + TextBlob (sentiment & keyword analysis)

### Frontend

* React (Vite)
* Axios
* JSZip

---

## 📦 Project Structure

```
AI-colorizer/
│
├── app/
│   ├── main.py              # API routes + security
│   ├── pipeline.py          # mode-based processing
│   ├── enhance.py           # enhancement variants
│   ├── colorize.py          # AI colorization (OpenCV DNN)
│   ├── feedback_nlp.py      # NLP analysis (NLTK + TextBlob)
│   ├── review_analytics.py  # user satisfaction visuals
│   └── dev_analytics.py     # developer-only analytics & reports
│
├── Reviews/                 # analytics data (tracked folder)
│   └── .gitkeep
│
├── uploads/                 # generated uploads (ignored)
├── outputs/                 # generated outputs (ignored)
│
├── models/
│   └── colorization/        # model files (ignored)
│
└── frontend/                # React frontend
```

---

## 🚀 Quickstart

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

* API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

* Frontend: [http://localhost:5173](http://localhost:5173)

---

## 🧩 Model Setup (Required)

This project uses pretrained OpenCV DNN colorization models.

Required local files:

```
models/colorization/
├── colorization_deploy_v2.prototxt
├── colorization_release_v2.caffemodel
└── pts_in_hull.npy
```

⚠️ These files are intentionally **not committed to GitHub** due to size and licensing considerations.

---

## 🔌 API Overview

### Upload & Process

```
POST /api/upload?mode=enhance|colorize|both
```

Returns:

* original image URL
* generated variant URLs

### Delete Generated Files

```
DELETE /api/delete_all
```

Clears:

* `/uploads`
* `/outputs`

### Developer Analytics (protected)

```
GET /api/dev/analytics
GET /api/dev/report
```

Requires `X-DEV-TOKEN` header.

---

## 🛣 Roadmap

* Improved colorization models (DeOldify / diffusion)
* Better variant diversity (model-level, not post-processing)
* Time-based analytics and trend visualization
* PDF report export
* Offline builds (EXE / APK)
* Optional multi-user session handling

---

## 📜 License & Credits

### Third-party models

This project uses pretrained assets from:

**Colorful Image Colorization**
Richard Zhang, Phillip Isola, Alexei A. Efros
ECCV 2016
License: BSD-2-Clause

Assets used:

* `colorization_deploy_v2.prototxt`
* `colorization_release_v2.caffemodel`
* `pts_in_hull.npy`

These files are downloaded locally during setup and are **not included in this repository**.