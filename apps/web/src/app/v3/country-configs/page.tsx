"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CountrySelector, type CountryCode } from "@/components/v3/CountrySelector";

type CountryConfig = {
  country_code: string;
  currency_code: string;
  legal_url: string | null;
  pricing_json: string | null;
  updated_at: string | null;
};

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("admin_access_token");
}

export default function CountryConfigsAdminPage() {
  const [adminToken, setAdminToken] = useState("");
  const [saved, setSaved] = useState(false);

  const [country, setCountry] = useState<CountryCode>("AU");
  const [rows, setRows] = useState<CountryConfig[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const current = useMemo(() => {
    return rows?.find((r) => r.country_code === country) ?? null;
  }, [rows, country]);

  const [currency, setCurrency] = useState("AUD");
  const [legalUrl, setLegalUrl] = useState<string>("");
  const [pricingJson, setPricingJson] = useState<string>("");

  useEffect(() => {
    const t = getAdminToken();
    if (t) setAdminToken(t);
    const savedCountry = window.localStorage.getItem("country_code") as CountryCode | null;
    if (savedCountry) setCountry(savedCountry);
  }, []);

  useEffect(() => {
    if (!current) return;
    setCurrency(current.currency_code);
    setLegalUrl(current.legal_url ?? "");
    setPricingJson(current.pricing_json ?? "");
  }, [current?.country_code]);

  async function load() {
    const token = adminToken.trim();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/backend/v3/admin/country-configs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setRows(json.country_configs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    const token = adminToken.trim();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/backend/v3/admin/country-configs/${encodeURIComponent(country)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currency_code: currency,
          legal_url: legalUrl.trim() ? legalUrl.trim() : null,
          pricing_json: pricingJson.trim() ? pricingJson : null
        })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Country configs (admin) — Phase 3</div>
          <div className="flex items-center gap-2">
            <CountrySelector onChange={(c) => setCountry(c)} />
            <Link href="/v3" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">
              Phase 3 home
            </Link>
            <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90">
              Phase 1 map
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1">
            <div className="text-sm font-semibold">Admin token (stub)</div>
            <div className="mt-2 text-sm text-white/70">
              Paste an admin JWT. This page calls <span className="font-mono">/v3/admin/country-configs</span>.
            </div>
            <textarea
              value={adminToken}
              onChange={(e) => {
                setAdminToken(e.target.value);
                setSaved(false);
              }}
              rows={5}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none focus:border-white/25"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
                onClick={() => {
                  window.localStorage.setItem("admin_access_token", adminToken.trim());
                  setSaved(true);
                }}
              >
                Save token
              </button>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                onClick={() => void load()}
                disabled={loading}
              >
                Load
              </button>
              {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
            </div>
            {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Edit config</div>
                <div className="text-xs text-white/60">Country: {country}</div>
              </div>
              <div className="text-xs text-white/50">
                Updated: {current?.updated_at ? new Date(current.updated_at).toLocaleString() : "—"}
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <div className="text-xs font-semibold text-white/80">Currency code</div>
                <input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                  placeholder="AUD"
                />
              </label>

              <label className="grid gap-2">
                <div className="text-xs font-semibold text-white/80">Legal URL</div>
                <input
                  value={legalUrl}
                  onChange={(e) => setLegalUrl(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                  placeholder="https://example.com/legal"
                />
              </label>

              <label className="grid gap-2">
                <div className="text-xs font-semibold text-white/80">Pricing JSON (string)</div>
                <textarea
                  value={pricingJson}
                  onChange={(e) => setPricingJson(e.target.value)}
                  rows={8}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs font-mono outline-none focus:border-white/25"
                  placeholder='{"teacher_basic_monthly": "..."}'
                />
              </label>

              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                disabled={loading || !adminToken.trim()}
                onClick={() => void saveConfig()}
              >
                Save config
              </button>
              <div className="text-xs text-white/50">
                Note: validation is enforced server-side (country + currency enums). This UI is a scaffold.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


