"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({ baseURL: API_URL, timeout: 15000 });

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const SEVERITY_COLOR = {
  CRITICAL: "var(--critical)",
  HIGH: "var(--high)",
  MEDIUM: "var(--medium)",
  LOW: "var(--low)",
};
const GRADE_COLOR = {
  A: "var(--safe)",
  B: "var(--low)",
  C: "var(--medium)",
  D: "var(--high)",
  F: "var(--critical)",
};

export default function ScanResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/scan/${id}`);
        setResult(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Could not load this scan.");
      }
    };
    load();
  }, [id]);

  const exportPdf = () => {
    window.open(`${API_URL}/api/scan/${id}/pdf`, "_blank");
  };
  const deleteScan = async () => {
    if (!confirm("Delete this scan? This cannot be undone.")) return;
    try {
      await api.delete(`/api/scan/${id}`);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete scan:", err);
      alert("Failed to delete scan. Please try again.");
    }
  };

  if (error) {
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
          <div
            className="p-4 rounded-md text-sm"
            style={{
              fontFamily: "var(--font-mono)",
              background: "rgba(255,92,92,0.08)",
              border: "1px solid var(--critical)",
              color: "var(--critical)",
            }}
          >
            ERROR: {error}
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm"
            style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
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
          <p
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            Loading scan...
          </p>
        </div>
      </div>
    );
  }

  const sortedFindings = [...result.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  sortedFindings.forEach((f) => {
    if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++;
  });
  const totalFindings = sortedFindings.length || 1;

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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm"
            style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
          >
            ← Back to home
          </button>

          <div className="flex gap-3">
            <button
              onClick={exportPdf}
              className="px-6 py-3 rounded-md text-sm tracking-wide uppercase transition"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-bright)",
              }}
            >
              ⬇ Export PDF
            </button>

            <button
              onClick={deleteScan}
              className="px-6 py-3 rounded-md text-sm tracking-wide uppercase transition"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                background: "transparent",
                color: "var(--critical)",
                border: "1px solid var(--critical)",
              }}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div
            className="md:col-span-2 rounded-lg p-8 flex flex-col items-center justify-center animate-grade-reveal"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-xs tracking-widest uppercase mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              Security Grade
            </span>
            <span
              className="text-8xl leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: GRADE_COLOR[result.grade],
              }}
            >
              {result.grade}
            </span>
            <span
              className="mt-3 text-sm"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
              }}
            >
              {result.score} / 100
            </span>
          </div>

          <div
            className="md:col-span-3 rounded-lg p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-xs tracking-widest uppercase block mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              Findings by severity
            </span>

            <div
              className="flex h-3 rounded-full overflow-hidden mb-5"
              style={{ background: "var(--surface-raised)" }}
            >
              {Object.entries(severityCounts).map(([sev, count]) =>
                count > 0 ? (
                  <div
                    key={sev}
                    style={{
                      width: `${(count / totalFindings) * 100}%`,
                      background: SEVERITY_COLOR[sev],
                    }}
                  />
                ) : null,
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(severityCounts).map(([sev, count]) => (
                <div key={sev}>
                  <div
                    className="text-2xl"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color:
                        count > 0
                          ? SEVERITY_COLOR[sev]
                          : "var(--text-tertiary)",
                    }}
                  >
                    {count}
                  </div>
                  <div
                    className="text-xs tracking-wide uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {sev}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {sortedFindings.length > 0 && (
          <div>
            <h2
              className="text-xs tracking-widest uppercase mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              Findings
            </h2>
            <div className="space-y-3">
              {sortedFindings.map((finding, idx) => (
                <FindingCard key={idx} finding={finding} delay={idx * 0.05} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingCard({ finding, delay }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyFix = async () => {
    try {
      await navigator.clipboard.writeText(finding.remediation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden animate-fade-slide-in"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${SEVERITY_COLOR[finding.severity]}`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded tracking-wide uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: SEVERITY_COLOR[finding.severity],
                background: "var(--surface-raised)",
              }}
            >
              {finding.severity}
            </span>
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-tertiary)",
              }}
            >
              {finding.check}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {finding.description}
          </p>
          <p
            className="text-xs mt-1 truncate"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            {finding.resource}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-xs px-3 py-1.5 rounded tracking-wide uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--brand)",
            border: "1px solid var(--border-bright)",
          }}
        >
          {expanded ? "Hide fix" : "Show fix"}
        </button>
      </div>

      {expanded && (
        <div
          className="px-4 pb-4 animate-fade-slide-in"
          style={{ animationDuration: "0.25s" }}
        >
          <div
            className="rounded-md p-3 text-xs relative"
            style={{
              fontFamily: "var(--font-mono)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              wordBreak: "break-word",
            }}
          >
            <button
              onClick={copyFix}
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded"
              style={{
                fontFamily: "var(--font-mono)",
                color: copied ? "var(--safe)" : "var(--text-tertiary)",
                background: "var(--surface-raised)",
              }}
            >
              {copied ? "copied" : "copy"}
            </button>
            <div className="pr-16">{finding.remediation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
