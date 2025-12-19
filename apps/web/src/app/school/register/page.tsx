"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SchoolRegisterStubPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem("school_access_token");
    if (existing) setToken(existing);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-sm text-white/60">
        <Link href="/" className="underline decoration-white/20 underline-offset-4 hover:decoration-white/50">
          ← Back to map
        </Link>
      </div>

      <h1 className="mt-6 text-2xl font-semibold">Browse as a School (stub)</h1>
      <p className="mt-3 text-sm text-white/70">
        Phase 1 placeholder: paste a <span className="font-semibold">school access token</span> so the frontend can call{" "}
        <span className="font-mono">/schools/teachers</span>.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-sm font-semibold">School access token</label>
        <textarea
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setSaved(false);
          }}
          rows={5}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none placeholder:text-white/40 focus:border-white/25"
          placeholder="Paste JWT here"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
            onClick={() => {
              window.localStorage.setItem("school_access_token", token.trim());
              setSaved(true);
            }}
          >
            Save token
          </button>
          {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
        </div>
      </div>
    </div>
  );
}


