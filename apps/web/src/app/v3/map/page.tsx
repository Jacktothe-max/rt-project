"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CountrySelector, type CountryCode } from "@/components/v3/CountrySelector";
import { fakeGeocode } from "@/lib/fakeGeocode";
import { MapDiscoveryV3 } from "@/components/v3/MapDiscoveryV3";
import { fetchCountryConfigsV3, type CountryConfigPublic } from "@/lib/api_v3";

export default function Phase3MapPage() {
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [postcodeInput, setPostcodeInput] = useState("");
  const [postcode, setPostcode] = useState<string | null>(null);
  const [country, setCountry] = useState<CountryCode>("AU");
  const [configs, setConfigs] = useState<CountryConfigPublic[] | null>(null);
  const [cfgError, setCfgError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("country_code") as CountryCode | null;
    if (saved) setCountry(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCountryConfigsV3()
      .then((rows) => {
        if (cancelled) return;
        setConfigs(rows);
        setCfgError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setConfigs(null);
        setCfgError(e instanceof Error ? e.message : "Failed to load country configs");
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const center = useMemo(() => {
    if (!postcode) return null;
    return fakeGeocode(postcode, "hero");
  }, [postcode]);

  const activeCfg = useMemo(() => {
    return configs?.find((c) => c.country_code === country) ?? null;
  }, [configs, country]);

  const parsedPricing = useMemo(() => {
    if (!activeCfg?.pricing_json) return null;
    try {
      const obj = JSON.parse(activeCfg.pricing_json);
      return typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, [activeCfg?.pricing_json]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Phase 3 Map (country-aware)</div>
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

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Postcode</div>
          <form
            className="mt-3 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const value = postcodeInput.trim();
              if (!value) return;
              setPostcode(value);
              mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <input
              value={postcodeInput}
              onChange={(e) => setPostcodeInput(e.target.value)}
              placeholder="Enter postcode"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none placeholder:text-white/40 focus:border-white/25"
            />
            <button type="submit" className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-ink-950 hover:bg-white/90">
              View map
            </button>
          </form>
          <div className="mt-3 text-xs text-white/50">
            This page uses `GET /schools/v3/teachers?country_code=...` (server-side country enforcement). Phase 1/2 pages are unchanged.
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            {cfgError ? (
              <div>Country config: {cfgError}</div>
            ) : activeCfg ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  Currency: <span className="font-semibold">{activeCfg.currency_code}</span>
                </div>
                <div className="flex items-center gap-3">
                  {activeCfg.legal_url ? (
                    <a className="underline decoration-white/30 underline-offset-4 hover:decoration-white/60" href={activeCfg.legal_url} target="_blank" rel="noreferrer">
                      Legal / compliance
                    </a>
                  ) : (
                    <span className="text-white/50">Legal URL not set</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-white/50">Country config not loaded.</div>
            )}

            {activeCfg?.pricing_json ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-xs font-semibold text-white/80">Pricing (from pricing_json)</div>
                {parsedPricing ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {Object.entries(parsedPricing)
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-white/70">{k}</span>
                          <span className="font-mono text-white/80">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-red-200">pricing_json is not valid JSON.</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section ref={mapSectionRef} className="mx-auto max-w-6xl px-4 pb-16">
        <MapDiscoveryV3 postcode={postcode} center={center} countryCode={country} />
      </section>
    </div>
  );
}


