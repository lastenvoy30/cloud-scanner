"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "./components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
});

const GRADE_COLOR = {
  A: "var(--safe)",
  B: "var(--low)",
  C: "var(--medium)",
  D: "var(--high)",
  F: "var(--critical)",
};

const SCAN_MESSAGES = [
  "ENUMERATING S3 BUCKETS...",
  "INSPECTING SECURITY GROUPS...",
  "AUDITING IAM POLICIES...",
  "SCORING FINDINGS...",
];

export default function Home() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanMsgIdx, setScanMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setScanMsgIdx((i) => (i + 1) % SCAN_MESSAGES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/scan/history");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, []);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    setScanMsgIdx(0);
    try {
      const res = await api.post("/api/scan/run");
      router.push(`/scan/${res.data._id}`);
    } catch (err) {
      setLoading(false);
      if (err.code === "ECONNABORTED") {
        setError("Scan timed out. Check AWS credentials or account size.");
      } else if (!err.response) {
        setError(
          "Cannot reach the backend server. Make sure it's running on port 5000.",
        );
      } else {
        setError(err.response?.data?.error || err.message || "Scan failed.");
      }
    }
  };
  const deleteScan = async (e, scanId) => {
    e.stopPropagation(); // prevent the row's onClick (navigation) from firing
    if (!confirm("Delete this scan? This cannot be undone.")) return;

    try {
      await api.delete(`/api/scan/${scanId}`);
      setHistory((prev) => prev.filter((s) => s._id !== scanId));
    } catch (err) {
      console.error("Failed to delete scan:", err);
      alert("Failed to delete scan. Please try again.");
    }
  };

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-10">
          <h1
            className="text-4xl tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
          >
            Cloud Security Scanner
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Automated misconfiguration detection for your AWS account
          </p>
        </header>

        <button
          onClick={runScan}
          disabled={loading}
          className="mb-8 px-6 py-3 rounded-md text-sm tracking-wide uppercase transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            background: loading ? "var(--surface-raised)" : "var(--brand)",
            color: loading ? "var(--text-secondary)" : "#0a0f1c",
            border: "1px solid var(--border-bright)",
          }}
        >
          {loading ? "Scanning..." : "▸ Run New Scan"}
        </button>

        {error && (
          <div
            className="mb-6 p-4 rounded-md text-sm"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(255,92,92,0.08)",
              border: "1px solid var(--critical)",
              color: "var(--critical)",
            }}
          >
            ERROR: {error}
          </div>
        )}

        {loading && (
          <div
            className="relative overflow-hidden rounded-lg p-16 text-center mb-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-32 pointer-events-none animate-sweep"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(110,143,255,0.18), transparent)",
              }}
            />
            <p
              className="relative text-sm tracking-widest uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
            >
              {SCAN_MESSAGES[scanMsgIdx]}
            </p>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div
            className="rounded-lg p-16 text-center"
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border-bright)",
            }}
          >
            <div
              className="text-3xl mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              [ · · · ]
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              No scans yet. Run your first scan to audit your AWS account.
            </p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div>
            <h2
              className="text-xs tracking-widest uppercase mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              Past Scans
            </h2>
            <div className="space-y-2">
              {history.map((scan) => (
                <div
                  key={scan._id}
                  onClick={() => router.push(`/scan/${scan._id}`)}
                  className="w-full text-left rounded-lg p-4 flex items-center justify-between transition hover:opacity-80 cursor-pointer"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-2xl"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        color: GRADE_COLOR[scan.grade],
                      }}
                    >
                      {scan.grade}
                    </span>
                    <div>
                      <div
                        style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                      >
                        {scan.score}/100 · {scan.findings.length} finding(s)
                      </div>
                      <div
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {new Date(scan.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => deleteScan(e, scan._id)}
                      className="text-xs px-3 py-1.5 rounded tracking-wide uppercase transition hover:opacity-80"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--critical)",
                        border: "1px solid var(--critical)",
                        background: "transparent",
                      }}
                    >
                      Delete
                    </button>
                    <span style={{ color: "var(--text-tertiary)" }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
