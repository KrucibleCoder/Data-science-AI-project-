import { useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleUpload() {
    if (!file) {
      setMsg("Please select an image first.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOriginalUrl(`${API_BASE}${res.data.original}`);
      setVariants(res.data.variants.map((v) => `${API_BASE}${v}`));
      setMsg("✅ Generated variants successfully!");
    } catch (err) {
      console.error(err);
      setMsg("❌ Upload failed. Check backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAll() {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/delete_all`);
      setOriginalUrl("");
      setVariants([]);
      setFile(null);
      setMsg("🧹 Deleted all uploaded and generated files.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>AI Image Colorizer (MVP)</h1>
      <p>Upload an image, get 3 variants, download what you like.</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Generate Variants"}
        </button>

        <button onClick={handleDeleteAll} disabled={loading}>
          Delete All
        </button>
      </div>

      {msg && <p style={{ marginTop: 16 }}>{msg}</p>}

      {originalUrl && (
        <div style={{ marginTop: 24 }}>
          <h2>Original</h2>
          <img
            src={originalUrl}
            alt="original"
            style={{ maxWidth: "100%", borderRadius: 12 }}
          />
        </div>
      )}

      {variants.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Variants</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {variants.map((url, idx) => (
              <div
                key={url}
                style={{
                  border: "1px solid #ddd",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <img
                  src={url}
                  alt={`variant-${idx}`}
                  style={{ width: "100%", borderRadius: 10 }}
                />
                <a
                  href={url}
                  download
                  style={{ display: "inline-block", marginTop: 10 }}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}