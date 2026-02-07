import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import "./App.css";

/* =========================
   Carousel auto-imports
   ========================= */

const bwImports = import.meta.glob(
  "./assets/Carousel/Original/*.{png,jpg,jpeg,webp}",
  { eager: true }
);

const coloredImports = import.meta.glob(
  "./assets/Carousel/Colored/*.{png,jpg,jpeg,webp}",
  { eager: true }
);

function importsToArray(imports) {
  return Object.values(imports).map((m) => m.default);
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect width="100%" height="100%" fill="#1b1b2b"/>
  <text x="50%" y="50%" fill="#aaa" font-size="16"
    text-anchor="middle" dominant-baseline="middle">
    No image yet
  </text>
</svg>`);

/* =========================
   Constants
   ========================= */

const API_BASE = "http://127.0.0.1:8000";
const VARIANT_LABELS = ["Natural", "Vivid", "Warm"];

/* =========================
   Main App
   ========================= */

export default function App() {
  /* ---------- State ---------- */
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("enhance");
  const [originalUrl, setOriginalUrl] = useState("");
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [downloadProgress, setDownloadProgress] = useState({});

  /* ---------- Carousel ---------- */
  const bwImages = importsToArray(bwImports);
  const coloredImages = importsToArray(coloredImports);

  const maxSlides = Math.max(bwImages.length, coloredImages.length, 1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  function nextSlide() {
    setCarouselIndex((i) => (i + 1) % maxSlides);
  }

  function prevSlide() {
    setCarouselIndex((i) => (i === 0 ? maxSlides - 1 : i - 1));
  }

  useEffect(() => {
    if (maxSlides <= 1) return;
    const t = setInterval(nextSlide, 4000);
    return () => clearInterval(t);
  }, [maxSlides]);

  /* ---------- Derived ---------- */
  const selectedFileName = useMemo(
    () => file?.name || "No file selected",
    [file]
  );

  /* =========================
     Backend actions
     ========================= */

  async function handleUpload() {
    if (loading || !file) return;

    setLoading(true);
    setMsg("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await axios.post(
        `${API_BASE}/api/upload?mode=${mode}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setOriginalUrl(`${API_BASE}${res.data.original}`);
      setVariants(res.data.variants.map((v) => `${API_BASE}${v}`));
      setDownloadProgress({});
      setMsg(`✅ Generated results using "${mode}" mode.`);
    } catch (e) {
      setMsg("❌ Upload failed. Check backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm("Delete all generated images?")) return;

    await axios.delete(`${API_BASE}/api/delete_all`);
    setFile(null);
    setOriginalUrl("");
    setVariants([]);
    setDownloadProgress({});
    setMsg("🧹 All generated images were deleted.");
  }

  async function downloadSingle(url, name) {
    setDownloadProgress((p) => ({ ...p, [url]: 0 }));
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    setDownloadProgress((p) => ({ ...p, [url]: 100 }));
  }

  async function downloadAllAsZip() {
    const zip = new JSZip();
    for (let i = 0; i < variants.length; i++) {
      const res = await fetch(variants[i]);
      zip.file(`${VARIANT_LABELS[i]}.jpg`, await res.blob());
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "generated_variants.zip";
    a.click();
  }

  /* =========================
     Render
     ========================= */

  return (
    <div className="page">
      {/* Top Bar */}
      <header className="topbar">
        <div>
          <h1 className="title">AI Image Colorizer</h1>
          <p className="subtitle">
            Upload a photo, choose a preset, preview variants, download what you like.
          </p>
        </div>
        <div className="chip">
          <span className="dot" />
          <span>Local API</span>
        </div>
      </header>

      {/* Workspace + Preview */}
      <main className="grid">
        <section className="card">
          <h2 className="cardTitle">Workspace</h2>

          <label className="fileBox">
            <input
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="fileBoxInner">
              <div className="fileIcon">📷</div>
              <div>
                <div className="fileName">{selectedFileName}</div>
                <div className="fileHint">PNG, JPG, WEBP</div>
              </div>
            </div>
          </label>

          <select
            className="select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="enhance">Enhance Only</option>
            <option value="colorize">Colorize Only</option>
            <option value="both">Enhance + Colorize</option>
          </select>

          <div className="actions">
            <button className="btn btnPrimary" onClick={handleUpload}>
              Generate Variants
            </button>
            <button className="btn btnDanger" onClick={handleDeleteAll}>
              Delete All
            </button>
          </div>

          {msg && <div className="message">{msg}</div>}
        </section>

        <section className="card">
          <h2 className="cardTitle">Preview</h2>

          {!originalUrl && <div className="empty">No image yet</div>}

          {originalUrl && (
            <>
              <span className="badge">Original</span>
              <img className="image" src={originalUrl} />
            </>
          )}
        </section>
      </main>

      {/* =========================
         Comparison + Feedback
         ========================= */}

      <section className="comparisonAndReviews">
        {/* Carousel */}
        <div className="comparisonCarousel">
          <h2 className="carouselTitle">Before & After Examples</h2>

          <div className="carouselRow">
            <div className="carouselImageBlock">
              <span>Black & White</span>
              <img src={bwImages[carouselIndex] || PLACEHOLDER} />
            </div>

            <div className="carouselImageBlock">
              <span>Colorized</span>
              <img src={coloredImages[carouselIndex] || PLACEHOLDER} />
            </div>
          </div>

          <div className="carouselControls">
            <button onClick={prevSlide}>◀</button>
            <span>
              {carouselIndex + 1} / {maxSlides}
            </span>
            <button onClick={nextSlide}>▶</button>
          </div>
        </div>

        {/* Review */}
        <div className="reviewPanel">
          <h2 className="reviewTitle">User Satisfaction</h2>
          <p className="reviewSubtitle">
            Aggregated feedback from sentiment analysis
          </p>

          <div className="reviewGlass">
            <div className="reviewGraphWrapper">
              <img
                src={`${API_BASE}/api/reviews/summary`}
                alt="User satisfaction graph"
              />
            </div>
          </div>

          <p className="reviewNote">
            This graph updates automatically as users submit feedback.
          </p>
        </div>
      </section>

      <footer className="footer">
        <span>Built with FastAPI + React</span>
      </footer>
    </div>
  );
}
