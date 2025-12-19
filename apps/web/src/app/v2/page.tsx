"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { MapDiscoveryV2 } from "@/components/v2/MapDiscoveryV2";
import { fakeGeocode } from "@/lib/fakeGeocode";

export default function MapV2Page() {
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [postcodeInput, setPostcodeInput] = useState("");
  const [postcode, setPostcode] = useState<string | null>(null);
  const [distanceEnabled, setDistanceEnabled] = useState(false);
  const [distanceKm, setDistanceKm] = useState(15);

  const center = useMemo(() => {
    if (!postcode) return null;
    return fakeGeocode(postcode, "hero");
  }, [postcode]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Map (Phase 2)</div>
          <div className="flex items-center gap-2">
            <Link href="/teacher/dashboard" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">
              Teacher dashboard
            </Link>
            <Link href="/school/dashboard" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">
              School dashboard
            </Link>
            <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90">
              Back to Phase 1
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
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/50">
              Phase 2 adds boosted highlighting + favourites + optional distance filtering (still uses backend discoverability).
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={distanceEnabled}
                  onChange={(e) => setDistanceEnabled(e.target.checked)}
                />
                Distance filter
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  disabled={!distanceEnabled}
                />
                <div className="w-16 text-right text-sm tabular-nums text-white/80">{distanceKm}km</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={mapSectionRef} className="mx-auto max-w-6xl px-4 pb-16">
        <MapDiscoveryV2 postcode={postcode} center={center} maxDistanceKm={distanceEnabled ? distanceKm : null} />
      </section>
    </div>
  );
}


