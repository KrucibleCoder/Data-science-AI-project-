import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import "./App.css";

/* =========================
   Carousel auto-imports
   ========================= */

const bwImports = import.meta.glob(
  "./assets/Carousel/Original/*.{png,jpg,jpeg,webp}",
  { eager: true },
);
const coloredImports = import.meta.glob(
  "./assets/Carousel/Colored/*.{png,jpg,jpeg,webp}",
  { eager: true },
);

function importsToArray(imports) {
  return Object.values(imports).map((m) => m.default);
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="100%" height="100%" fill="#1b1b2b"/>
    <text x="50%" y="50%" fill="#aaa" font-size="18"
      text-anchor="middle" dominant-baseline="middle">
      No image yet
    </text>
  </svg>
`);

/* =========================
   Main app
   ========================= */

const API_BASE = "http://127.0.0.1:8000";
const VARIANT_LABELS = ["Natural", "Vivid", "Warm"];

export default function App() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("enhance");
  const [originalUrl, setOriginalUrl] = useState("");
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [downloadProgress, setDownloadProgress] = useState({});

  /* ===== Carousel state ===== */

  const bwImages = importsToArray(bwImports);
  const coloredImages = importsToArray(coloredImports);

  const maxSlides = Math.max(bwImages.length, coloredImages.length, 1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  function nextSlide() {
    setCarouselIndex((prev) => (prev + 1) % maxSlides);
  }

  function prevSlide() {
    setCarouselIndex((prev) => (prev === 0 ? maxSlides - 1 : prev - 1));
  }

  // Auto-rotate carousel
  useEffect(() => {
    if (maxSlides <= 1) return;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % maxSlides);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [maxSlides]);

  const selectedFileName = useMemo(
    () => file?.name || "No file selected",
    [file],
  );

  /* =========================
     Backend actions
     ========================= */

  async function handleUpload() {
    if (loading) return;

    if (!file) {
      setMsg("Please select an image first.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMsg("File too large. Please upload an image under 10MB.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${API_BASE}/api/upload?mode=${mode}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setOriginalUrl(`${API_BASE}${res.data.original}`);
      setVariants(res.data.variants.map((v) => `${API_BASE}${v}`));
      setDownloadProgress({});
      setMsg(`✅ Generated results using "${mode}" mode.`);
    } catch (err) {
      console.error(err);
      setMsg("❌ Upload failed. Check backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all generated images?\n\nThis action cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/delete_all`);
      setOriginalUrl("");
      setVariants([]);
      setFile(null);
      setDownloadProgress({});
      setMsg("🧹 All generated images were deleted.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  async function forceDownloadWithProgress(url, filename) {
    setDownloadProgress((p) => ({ ...p, [url]: 0 }));

    const res = await fetch(url);
    const reader = res.body.getReader();
    const total = +res.headers.get("Content-Length") || 1;

    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      setDownloadProgress((p) => ({
        ...p,
        [url]: Math.floor((received / total) * 100),
      }));
    }

    const blob = new Blob(chunks);
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    setDownloadProgress((p) => ({ ...p, [url]: 100 }));
  }

  async function downloadAllAsZip() {
    const zip = new JSZip();

    for (let i = 0; i < variants.length; i++) {
      const res = await fetch(variants[i]);
      zip.file(`${VARIANT_LABELS[i]}.jpg`, await res.blob());
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_variants.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* =========================
     Render
     ========================= */

  return (
    <div className="page">
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

      <main className="grid">
        {/* Workspace */}
        <section className="card">
          <h2 className="cardTitle">Workspace</h2>

          <label className="fileBox">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={loading}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setOriginalUrl("");
                setVariants([]);
                setMsg("");
              }}
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
            disabled={loading}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="enhance">Enhance Only</option>
            <option value="colorize">Colorize Only</option>
            <option value="both">Enhance + Colorize</option>
          </select>

          <div className="actions">
            <button className="btn btnPrimary" onClick={handleUpload}>
              {loading ? "Processing..." : "Generate Variants"}
            </button>
            <button
              className="btn btnDanger"
              onClick={handleDeleteAll}
              disabled={!originalUrl && variants.length === 0}
            >
              Delete All
            </button>
          </div>

          {msg && <div className="message">{msg}</div>}
        </section>

        {/* Preview */}
        <section className="card">
          <h2 className="cardTitle">Preview</h2>

          {!originalUrl && variants.length === 0 && (
            <div className="empty">
              <div className="emptyIcon">🖼️</div>
              <div className="emptyTitle">No image yet</div>
              <div className="emptyText">
                Upload an image and generate variants to preview them here.
              </div>
            </div>
          )}

          {originalUrl && (
            <div className="previewBlock">
              <span className="badge">Original</span>
              <img className="image" src={originalUrl} alt="Original" />
            </div>
          )}

          {variants.length > 0 && (
            <>
              <div className="variantsHeader">
                <h3>Variants</h3>
                <button
                  className="btn btnPrimary btnSmall"
                  onClick={downloadAllAsZip}
                >
                  Download All
                </button>
              </div>

              <div className="variantsGrid">
                {variants.map((url, idx) => {
                  const progress = downloadProgress[url];

                  return (
                    <div key={url} className="variantCard">
                      <div className="variantTop">
                        <span className="badge">{VARIANT_LABELS[idx]}</span>
                        <button
                          className="link"
                          onClick={() =>
                            forceDownloadWithProgress(
                              url,
                              `${VARIANT_LABELS[idx]}.jpg`,
                            )
                          }
                        >
                          Download
                        </button>
                      </div>

                      <img className="image" src={url} alt={VARIANT_LABELS[idx]} />

                      {progress !== undefined && progress < 100 && (
                        <div className="progressOverlay">
                          <div
                            className="progressFill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Carousel */}
      <section className="comparisonCarousel">
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
      </section>

      <footer className="footer">
        <span>Built with FastAPI + React</span>
      </footer>
    </div>
  );
}
