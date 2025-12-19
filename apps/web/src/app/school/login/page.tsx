"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SchoolLoginPage() {
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

      <h1 className="mt-6 text-2xl font-semibold">School login</h1>
      <p className="mt-3 text-sm text-white/70">
        School browsing endpoints require a JWT with <span className="font-mono">role=school</span>. Swagger does not currently include a
        school registration/login endpoint, so this page is a scaffold to paste a JWT.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-sm font-semibold">School access token</label>
        <textarea
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setSaved(false);
          }}
          rows={6}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none placeholder:text-white/40 focus:border-white/25"
          placeholder="Paste JWT here"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
            onClick={() => {
              const t = token.trim();
              window.localStorage.setItem("school_access_token", t);
              window.localStorage.setItem("any_access_token", t);
              setSaved(true);
            }}
          >
            Save token
          </button>
          {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
          <Link href="/school/dashboard" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
            Go to dashboard
          </Link>
          <Link href="/school/register" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
            Browse (token setup)
          </Link>
        </div>
      </div>
    </div>
  );
}


