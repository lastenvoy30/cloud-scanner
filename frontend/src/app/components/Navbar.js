"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Navbar() {
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="border-b sticky top-0 z-10"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
        >
          Perimeter
        </Link>

        <div
          className="flex items-center gap-2 text-xs tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background:
                backendOnline === null
                  ? "var(--text-tertiary)"
                  : backendOnline
                  ? "var(--safe)"
                  : "var(--critical)",
            }}
          />
          {backendOnline === null
            ? "Checking..."
            : backendOnline
            ? "Connected"
            : "Offline"}
        </div>
      </div>
    </nav>
  );
}