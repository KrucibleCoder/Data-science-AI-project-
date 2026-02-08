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

  useEffect(() => {
    if (maxSlides <= 1) return;
    const t = setInterval(
      () => setCarouselIndex((i) => (i + 1) % maxSlides),
      4000,
    );
    return () => clearInterval(t);
  }, [maxSlides]);

  const selectedFileName = useMemo(
    () => file?.name || "No file selected",
    [file],
  );

  /* ---------- Feedback state (single comment, per-variant scores) ---------- */
  const [scores, setScores] = useState({}); // { [url]: number (0-100) }
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  function initScoresForVariants(vars) {
    const s = {};
    vars.forEach((v, i) => {
      s[v] = scores[v] ?? 100; // default 100 (like)
    });
    setScores(s);
  }

  useEffect(() => {
    initScoresForVariants(variants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants.length]);

  /* optional small UX: auto-clear message after a short time */
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

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
      const vs = res.data.variants.map((v) => `${API_BASE}${v}`);
      setVariants(vs);
      setDownloadProgress({});
      initScoresForVariants(vs);
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
      setScores({});
      setFeedbackComment("");
      setMsg("🧹 All generated images were deleted.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Downloads ---------- */

  async function forceDownloadWithProgress(url, filename) {
    setDownloadProgress((p) => ({ ...p, [url]: 0 }));

    try {
      const res = await fetch(url);
      const reader = res.body.getReader();
      const contentLength = +res.headers.get("Content-Length") || 0;

      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength) {
          setDownloadProgress((p) => ({
            ...p,
            [url]: Math.floor((received / contentLength) * 100),
          }));
        }
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
    } catch (err) {
      console.error("Download failed", err);
      setMsg("❌ Download failed.");
      setDownloadProgress((p) => {
        const copy = { ...p };
        delete copy[url];
        return copy;
      });
    }
  }

  async function downloadAllAsZip() {
    if (variants.length === 0) return;
    const zip = new JSZip();
    for (let i = 0; i < variants.length; i++) {
      try {
        const r = await fetch(variants[i]);
        const blob = await r.blob();
        const label = VARIANT_LABELS[i] || `variant_${i + 1}`;
        zip.file(`${label}.jpg`, blob);
      } catch (err) {
        console.warn("Failed to fetch variant for zip", variants[i], err);
      }
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
     Feedback submit (single comment for all variants)
     ========================= */

  async function submitAllFeedback() {
    if (variants.length === 0) {
      setMsg("No variants to review.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      // Send one POST per variant (backend should accept this path)
      for (let i = 0; i < variants.length; i++) {
        const img = variants[i];
        const label = VARIANT_LABELS[i] || `Variant ${i + 1}`;
        const score = Math.max(0, Math.min(100, scores[img] ?? 100));
        try {
          await axios.post(`${API_BASE}/api/reviews`, {
            image: img,
            label,
            score,
            comment: feedbackComment,
          });
        } catch (err) {
          // ignore per-image error but log
          console.warn("feedback submit failed for", img, err);
        }
      }
      setMsg("✅ Feedback submitted for all variants.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Feedback submission error.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  /* =========================
     Render
     ========================= */

  const SKELETON_COUNT = 3;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="title">AI Image Colorizer</h1>
          <p className="subtitle">
            Upload a photo, choose a preset, preview variants, download what you
            like.
          </p>
        </div>
        <div className="chip">
          <span className="dot" />
          <span>Local API</span>
        </div>
      </header>

      {/* Workspace + Preview */}
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
              <div className="fileText">
                <div className="fileName">{selectedFileName}</div>
                <div className="fileHint">PNG, JPG, WEBP</div>
              </div>
            </div>
          </label>

          <div className="controlGroup">
            <label className="label">Mode</label>
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
          </div>

          <div className="actions">
            <button
              className="btn btnPrimary"
              onClick={handleUpload}
              disabled={loading}
            >
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

          {loading && (
            <div
              className="subtleStatus"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "rgba(234,234,241,0.6)",
              }}
            >
              Processing image, generating variants...
            </div>
          )}

          {msg && <div className="message">{msg}</div>}
        </section>

        <section className="card">
          <h2 className="cardTitle">Preview</h2>

          {!originalUrl && variants.length === 0 && !loading && (
            <div className="empty">
              <div className="emptyIcon">🖼️</div>
              <div className="emptyTitle">No image yet</div>
              <div className="emptyText">
                Upload an image and generate variants to preview them here.
              </div>
            </div>
          )}

          {file && !originalUrl && loading && (
            <div className="empty">
              <div className="emptyIcon">⏳</div>
              <div className="emptyTitle">Processing image…</div>
            </div>
          )}

          {originalUrl && (
            <div className="previewBlock">
              <span className="badge">Original</span>
              <img className="image" src={originalUrl} alt="Original" />
            </div>
          )}
        </section>
      </main>

      {/* Downloads + Feedback panels placed directly below workspace/preview
          Show while loading OR once variants exist (so skeletons appear while processing) */}
      {(loading || variants.length > 0) && (
        <section className="comparisonAndReviews" style={{ marginTop: 20 }}>
          <div className="comparisonLeft">
            <section className="comparisonCarousel">
              <h2 className="carouselTitle">Downloads</h2>

              <div className="downloadGrid">
                {loading
                  ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        className="downloadCard skeleton-card"
                      >
                        <div
                          className="downloadTop"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: 8,
                          }}
                        >
                          <div className="skeleton skeleton-button" />
                        </div>

                        <div className="thumbWrapper" style={{ marginTop: 8 }}>
                          <div className="skeleton skeleton-thumb" />
                        </div>

                        <div
                          className="skeleton skeleton-line medium"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    ))
                  : variants.map((url, idx) => {
                      const progress = downloadProgress[url];
                      const label = VARIANT_LABELS[idx] || `Variant ${idx + 1}`;

                      return (
                        <div key={url} className="downloadCard">
                          <div className="downloadTop">
                            <button
                              className="btnSmall"
                              onClick={() =>
                                forceDownloadWithProgress(url, `${label}.jpg`)
                              }
                            >
                              Download
                            </button>
                          </div>

                          <div className="thumbWrapper">
                            <img className="thumb" src={url} alt={label} />
                            {progress !== undefined && progress < 100 && (
                              <div className="progressOverlay">
                                <div
                                  className="progressFill"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              textAlign: "center",
                              fontSize: 12,
                              color: "rgba(234,234,241,0.7)",
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      );
                    })}
              </div>

              {!loading && variants.length > 0 && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <button
                    className="btn btnPrimary btnSmall"
                    onClick={downloadAllAsZip}
                  >
                    Download All as ZIP
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="comparisonRight">
            <section className="comparisonCarousel">
              <h2 className="carouselTitle">Reviews</h2>

              <div className="feedbackGrid">
                {loading
                  ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                      <div
                        key={`fs-${i}`}
                        className="feedbackRow skeleton-card"
                        style={{ padding: 10 }}
                      >
                        <div className="skeleton skeleton-line short" />
                        <div className="skeleton skeleton-line" />
                      </div>
                    ))
                  : variants.map((url, idx) => {
                      const label = VARIANT_LABELS[idx] || `Variant ${idx + 1}`;
                      const value = scores[url] ?? 100;

                      return (
                        <div key={url} className="feedbackRow">
                          <div className="feedbackLabel">{label}</div>
                          <div className="feedbackSliderRow">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={value}
                              onChange={(e) =>
                                setScores((s) => ({
                                  ...s,
                                  [url]: Number(e.target.value),
                                }))
                              }
                            />
                            <div className="sliderValue">{value}%</div>
                          </div>
                        </div>
                      );
                    })}
              </div>

              {!loading && (
                <div style={{ marginTop: 12 }}>
                  <div className="feedbackRow feedbackCommentRow">
                    <textarea
                      className="feedbackTextarea"
                      placeholder="Optional feedback comment for all variants..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      className="btn btnPrimary"
                      onClick={submitAllFeedback}
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback
                        ? "Submitting..."
                        : "Submit All Feedback"}
                    </button>

                    <button
                      className="btn"
                      onClick={() => {
                        setFeedbackComment("");
                        setScores({});
                        initScoresForVariants(variants);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      {/* Carousel + User Preference (keeps previous layout below) */}
      <section className="comparisonAndReviews" style={{ marginTop: 30 }}>
        <div className="comparisonLeft">
          <section className="comparisonCarousel">
            <h2 className="carouselTitle">Before & After</h2>

            <div className="carouselRow">
              <div className="carouselImageBlock">
                <span>Black & White</span>
                <img
                  src={bwImages[carouselIndex] || PLACEHOLDER}
                  alt="bw example"
                />
              </div>

              <div className="carouselImageBlock">
                <span>Colorized</span>
                <img
                  src={coloredImages[carouselIndex] || PLACEHOLDER}
                  alt="colorized example"
                />
              </div>
            </div>

            <div className="carouselControls">
              <button
                onClick={() =>
                  setCarouselIndex((i) => (i === 0 ? maxSlides - 1 : i - 1))
                }
              >
                ◀
              </button>
              <span>
                {carouselIndex + 1} / {maxSlides}
              </span>
              <button
                onClick={() => setCarouselIndex((i) => (i + 1) % maxSlides)}
              >
                ▶
              </button>
            </div>
          </section>
        </div>

        <div className="comparisonRight">
          <div className="reviewPanel">
            <h2 className="reviewTitle">User Preference</h2>
            <p className="reviewSubtitle">
              Aggregated feedback from sentiment analysis
            </p>

            <div className="reviewGlass">
              <div className="reviewGraphWrapper">
                <img
                  src={`${API_BASE}/api/reviews/summary`}
                  alt="User Preference graph"
                />
              </div>
            </div>

            <p className="reviewNote">
              This graph updates automatically as users submit feedback.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>Built with FastAPI + React</span>
      </footer>
    </div>
  );
}
