"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

const SCAN_MESSAGES = [
  "ENUMERATING S3 BUCKETS...",
  "INSPECTING SECURITY GROUPS...",
  "AUDITING IAM POLICIES...",
  "SCORING FINDINGS...",
];

export default function Dashboard() {
  const [result, setResult] = useState(null);
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
      const res = await axios.get(`${API_URL}/api/scan/history`);
      setHistory([...res.data].reverse());
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const runScan = async () => {
    setLoading(true);
    setError(null);
    setScanMsgIdx(0);
    try {
      const res = await axios.post(`${API_URL}/api/scan/run`);
      setResult(res.data);
      await fetchHistory();
    } catch (err) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, []);

  const sortedFindings = result
    ? [...result.findings].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      )
    : [];

  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  sortedFindings.forEach((f) => {
    if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++;
  });
  const totalFindings = sortedFindings.length || 1;

  const chartData = history.map((h) => ({
    date: new Date(h.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    score: h.score,
  }));

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Status eyebrow */}
        <div
          className="flex items-center gap-2 mb-6 text-xs tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "var(--safe)" }}
          />
          System connected
          <span className="animate-blink" style={{ color: "var(--brand)" }}>
            _
          </span>
        </div>

        {/* Header */}
        <header className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1
              className="text-4xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Perimeter
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Automated misconfiguration detection for your AWS account
            </p>
          </div>

          <button
            onClick={runScan}
            disabled={loading}
            className="px-6 py-3 rounded-md text-sm tracking-wide uppercase transition disabled:opacity-60 disabled:cursor-not-allowed"
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
        </header>

        {error && (
          <div
            className="mb-6 p-4 rounded-md text-sm animate-fade-slide-in"
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

        {!result && !loading && (
          <div
            className="rounded-lg p-16 text-center animate-fade-slide-in"
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border-bright)",
            }}
          >
            <div
              className="text-3xl mb-3"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              [ · · · ]
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              No scans yet. Run your first scan to audit your AWS account.
            </p>
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

        {result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div
              className="md:col-span-2 rounded-lg p-8 flex flex-col items-center justify-center animate-grade-reveal"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span
                className="text-xs tracking-widest uppercase mb-3"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
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
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
              >
                {result.score} / 100
              </span>
            </div>

            <div
              className="md:col-span-3 rounded-lg p-8 animate-fade-slide-in"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span
                className="text-xs tracking-widest uppercase block mb-4"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
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
                  ) : null
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
                        color: count > 0 ? SEVERITY_COLOR[sev] : "var(--text-tertiary)",
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
        )}

        {chartData.length > 1 && (
          <div
            className="rounded-lg p-6 mb-8"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2
              className="text-xs tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              Score trend
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-tertiary)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--text-tertiary)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-bright)",
                    borderRadius: 6,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--brand)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {sortedFindings.length > 0 && !loading && (
          <div>
            <h2
              className="text-xs tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
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
      // clipboard not available, ignore
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
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
            >
              {finding.check}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {finding.description}
          </p>
          <p
            className="text-xs mt-1 truncate"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
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
        <div className="px-4 pb-4 animate-fade-slide-in" style={{ animationDuration: "0.25s" }}>
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