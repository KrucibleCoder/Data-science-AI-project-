import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

/**
 * TEMPORARY: Dev token hardcoded for demo branch
 * Remove or replace later if you add a prompt
 */
const DEV_TOKEN = "demo-dev-token_00";

export default function DevDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [reportUrl, setReportUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     Fetch analytics JSON
     ========================= */
  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`${API_BASE}/api/dev/analytics`, {
          headers: {
            "X-DEV-TOKEN": DEV_TOKEN,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized or dev analytics unavailable");
        }

        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load developer analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  /* =========================
     Fetch report image as blob
     ========================= */
  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`${API_BASE}/api/dev/report`, {
          headers: {
            "X-DEV-TOKEN": DEV_TOKEN,
          },
        });

        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setReportUrl(url);

        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Report image unavailable");
      }
    }

    loadReport();
  }, []);

  /* =========================
     Render
     ========================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        background: "linear-gradient(180deg, #0f1020, #0b0c18)",
        color: "#eaeaf1",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>
          Developer Analytics Dashboard
        </h1>
        <p style={{ opacity: 0.7 }}>
          Internal NLP & feedback diagnostics (not user-facing)
        </p>
      </header>

      {loading && <p>Loading analytics…</p>}
      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      {!loading && analytics && (
        <>
          {/* =========================
              Variant Analytics Cards
             ========================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {Object.entries(analytics).map(([label, info]) => (
              <div
                key={label}
                style={{
                  background: "rgba(20,20,35,0.75)",
                  borderRadius: 14,
                  padding: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>{label}</h2>

                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div>Reviews: {info.reviews}</div>
                  <div>Avg Score: {info.avg_score}</div>
                  <div>Variance: {info.variance}</div>
                  <div>Polarity: {info.avg_polarity}</div>
                  <div>Subjectivity: {info.avg_subjectivity}</div>
                </div>

                {info.top_keywords?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <strong style={{ fontSize: 13 }}>Top Keywords</strong>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {info.top_keywords.map(([k]) => k).join(", ")}
                    </div>
                  </div>
                )}

                {info.notes?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <strong style={{ fontSize: 13 }}>Observations</strong>
                    <ul style={{ paddingLeft: 16, fontSize: 12 }}>
                      {info.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* =========================
              Report Preview + Download
             ========================= */}
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>
              Generated Developer Report
            </h2>

            {reportUrl ? (
              <>
                <div
                  style={{
                    background: "rgba(20,20,35,0.6)",
                    padding: 16,
                    borderRadius: 14,
                    display: "inline-block",
                  }}
                >
                  <img
                    src={reportUrl}
                    alt="Developer report"
                    style={{ maxWidth: "100%", borderRadius: 10 }}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <a
                    href={reportUrl}
                    download="developer_report.png"
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: "#4C78A8",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    Download Report
                  </a>
                </div>
              </>
            ) : (
              <p style={{ opacity: 0.7 }}>
                Report image not available yet.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
