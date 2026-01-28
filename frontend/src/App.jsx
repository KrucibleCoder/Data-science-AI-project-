import { useMemo, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import "./App.css";

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

  const selectedFileName = useMemo(
    () => file?.name || "No file selected",
    [file]
  );

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
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setOriginalUrl(`${API_BASE}${res.data.original}`);
      setVariants(res.data.variants.map(v => `${API_BASE}${v}`));
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
      "Are you sure you want to delete all generated images?\n\nThis action cannot be undone."
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
    setDownloadProgress(prev => ({ ...prev, [url]: 0 }));

    const res = await fetch(url);
    const reader = res.body.getReader();
    const contentLength = +res.headers.get("Content-Length");

    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;

      setDownloadProgress(prev => ({
        ...prev,
        [url]: Math.floor((received / contentLength) * 100),
      }));
    }

    const blob = new Blob(chunks);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    setDownloadProgress(prev => ({ ...prev, [url]: 100 }));
  }

  async function downloadAllAsZip() {
    const zip = new JSZip();

    for (let i = 0; i < variants.length; i++) {
      const res = await fetch(variants[i]);
      const blob = await res.blob();
      zip.file(`${VARIANT_LABELS[i]}.jpg`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);

    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = "generated_variants.zip";
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);
  }

  return (
    <div className="page">
      {/* Top bar */}
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

      {/* Main grid */}
      <main className="grid">
        {/* Workspace */}
        <section className="card">
          <h2 className="cardTitle">Workspace</h2>

          <div className="controlGroup">
            <label className="label">Upload image</label>
            <label className="fileBox">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={loading}
                onChange={e => {
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
          </div>

          <div className="controlGroup">
            <label className="label">Mode</label>
            <select
              className="select"
              value={mode}
              disabled={loading}
              onChange={e => setMode(e.target.value)}
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
              disabled={loading || (!originalUrl && variants.length === 0)}
            >
              Delete All
            </button>
          </div>

          {msg && <div className="message">{msg}</div>}

          <div className="tips">
            <div className="tipTitle">Tips</div>
            <ul>
              <li>Old or faded photos work best.</li>
              <li>Use “Both” for enhanced color and sharpness.</li>
              <li>Delete clears all server-side files.</li>
            </ul>
          </div>
        </section>

        {/* Preview */}
        <section className="card">
          <div className="cardHeaderRow">
            <h2 className="cardTitle">Preview</h2>
            <span className="muted">
              {variants.length === 0 ? "Waiting for upload" : ""}
            </span>
          </div>

          {variants.length === 0 ? (
            <div className="empty">
              <div className="emptyIcon">🖼️</div>
              <div className="emptyTitle">No image yet</div>
              <div className="emptyText">
                Upload an image and generate variants to preview them here.
              </div>
            </div>
          ) : (
            <>
              <div className="variantsHeader">
                <h3 className="variantsTitle">Variants</h3>
                <button className="btn btnPrimary" onClick={downloadAllAsZip}>
                  Download All
                </button>
              </div>

              <div className="variantsGrid">
                {variants.map((url, idx) => {
                  const progress = downloadProgress[url] ?? null;

                  return (
                    <div key={url} className="variantCard">
                      <div className="variantTop">
                        <span className="badge">{VARIANT_LABELS[idx]}</span>
                        <button
                          className="link"
                          disabled={progress !== null && progress < 100}
                          onClick={() =>
                            forceDownloadWithProgress(
                              url,
                              `${VARIANT_LABELS[idx]}.jpg`
                            )
                          }
                        >
                          Download
                        </button>
                      </div>

                      <div className="imageWrapper">
                        <img
                          src={url}
                          alt={VARIANT_LABELS[idx]}
                          className={
                            progress !== null && progress < 100
                              ? "image downloading"
                              : "image"
                          }
                        />
                        {progress !== null && progress < 100 && (
                          <div className="progressOverlay">
                            <div
                              className="progressFill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>Built with FastAPI + React</span>
      </footer>
    </div>
  );
}
