"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapDiscovery } from "@/components/MapDiscovery";
import { fakeGeocode } from "@/lib/fakeGeocode";
import { CountrySelector } from "@/components/v3/CountrySelector";

export default function HomePage() {
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
      {/* Sticky CTAs */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 shadow-sm">
              <div className="h-4 w-4 rounded-full bg-white/70" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Relief Teaching Marketplace</div>
              <div className="hidden text-xs text-white/55 sm:block">Discoverable teachers • Real-time map</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CountrySelector />
            <Link
              href="/teacher/register"
              className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90"
            >
              Register as a Teacher
            </Link>
            <Link
              href="/school/register"
              className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/15"
            >
              Browse as a School
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
              Phase 1 • Live discovery map
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Find available relief teachers in seconds.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              Enter a postcode to jump straight to the map. Teachers shown are discoverable only when subscription is active and available today.
            </p>

            <form
              className="mx-auto mt-7 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const value = postcodeInput.trim();
                if (!value) return;
                setPostcode(value);
                mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <div className="relative w-full">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <input
                  value={postcodeInput}
                  onChange={(e) => setPostcodeInput(e.target.value)}
                  placeholder="Enter postcode"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-white/25 focus:bg-white/10 placeholder:text-white/40"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-2xl bg-white px-6 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90"
              >
                View map
              </button>
            </form>

            <div className="mt-4 text-xs text-white/50">
              Note: Postcode geocoding is a Phase 1 placeholder (deterministic mapping, replaceable later).
            </div>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm">
                <div className="text-sm font-semibold">Register as a Teacher</div>
                <div className="mt-1 text-sm text-white/70">Create a profile and manage your availability.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm">
                <div className="text-sm font-semibold">Browse as a School</div>
                <div className="mt-1 text-sm text-white/70">View discoverable teachers on the live map.</div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6 text-left shadow-sm">
              <div className="text-sm font-semibold">School access</div>
              <div className="mt-2 text-sm leading-relaxed text-white/70">
                The backend school endpoints require an authenticated school token. Use the stub page{" "}
                <Link href="/school/register" className="underline decoration-white/30 underline-offset-4 hover:decoration-white/60">
                  Browse as a School
                </Link>{" "}
                to paste a token into local storage.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map section */}
      <section ref={mapSectionRef} className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-semibold tracking-tight">Discoverable teachers</div>
            <div className="mt-1 text-sm text-white/60">
              Heatmap + clusters by default. Zoom in to dissolve into clickable avatars.
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-white/60">
            Phase 2 additions (optional): boosted highlighting + distance filtering. Phase 1 discoverability remains enforced by backend.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={distanceEnabled}
                onChange={(e) => setDistanceEnabled(e.target.checked)}
                disabled={!postcode}
              />
              Distance filter
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                disabled={!distanceEnabled || !postcode}
              />
              <div className="w-16 text-right text-sm tabular-nums text-white/80">{distanceKm}km</div>
            </div>
          </div>
        </div>

        <MapDiscovery
          postcode={postcode}
          center={center}
          maxDistanceKm={distanceEnabled && postcode ? distanceKm : null}
        />
      </section>
    </div>
  );
}


