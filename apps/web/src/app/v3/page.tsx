"use client";

import Link from "next/link";
import { CountrySelector } from "@/components/v3/CountrySelector";

export default function Phase3Home() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Phase 3 (Scaffolding)</div>
          <div className="flex items-center gap-2">
            <CountrySelector />
            <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90">
              Phase 1 map
            </Link>
            <Link href="/v2" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">
              Phase 2 map
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <Link href="/v3/map" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-sm font-semibold">Country-aware map</div>
            <div className="mt-2 text-sm text-white/70">Uses `/schools/v3/teachers` and enforces `country_code` server-side.</div>
          </Link>
          <Link href="/v3/country-configs" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-sm font-semibold">Country configs (admin)</div>
            <div className="mt-2 text-sm text-white/70">Edit currency, pricing JSON, and legal URL (admin-only scaffold).</div>
          </Link>
          <Link href="/v3/enterprise" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-sm font-semibold">Enterprise dashboard</div>
            <div className="mt-2 text-sm text-white/70">Manage multi-school orgs, reporting, batch actions (stub).</div>
          </Link>
          <Link href="/v3/messages" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-sm font-semibold">Messaging</div>
            <div className="mt-2 text-sm text-white/70">Send/receive messages (Phase 3 scaffold).</div>
          </Link>
          <Link href="/v3/verifications" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-sm font-semibold">Credential verification</div>
            <div className="mt-2 text-sm text-white/70">Submit and view verification status (stub).</div>
          </Link>
        </div>
      </div>
    </div>
  );
}


