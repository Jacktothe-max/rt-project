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
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:pb-24 sm:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-1.5 text-xs font-medium text-emerald-200 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              </span>
              Live discovery available now
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Find available relief teachers
              <span className="block text-white/60">in seconds</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
              Connect with qualified relief teachers instantly. Search by location, view real-time availability, and build your trusted network.
            </p>

            <form
              className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const value = postcodeInput.trim();
                if (!value) return;
                setPostcode(value);
                mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <div className="relative w-full">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <input
                  value={postcodeInput}
                  onChange={(e) => setPostcodeInput(e.target.value)}
                  placeholder="Enter your postcode"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base shadow-lg outline-none transition focus:border-white/25 focus:bg-white/10 focus:shadow-xl placeholder:text-white/40"
                />
              </div>
              <button
                type="submit"
                className="group h-14 rounded-2xl bg-white px-8 text-base font-semibold text-ink-950 shadow-lg transition hover:scale-105 hover:bg-white/95 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  Search
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </form>

            <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
              <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="text-base font-semibold">Real-time Availability</div>
                <div className="mt-2 text-sm leading-relaxed text-white/60">See who's available right now, updated live across the platform.</div>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="text-base font-semibold">Location-based Search</div>
                <div className="mt-2 text-sm leading-relaxed text-white/60">Find teachers in your area with distance filtering and map view.</div>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:shadow-xl">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="text-base font-semibold">Verified Profiles</div>
                <div className="mt-2 text-sm leading-relaxed text-white/60">Browse qualified teachers with complete profiles and credentials.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map section */}
      <section ref={mapSectionRef} className="mx-auto max-w-6xl px-4 pb-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse Available Teachers</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/60">
            Explore qualified relief teachers in your area. Zoom in to see individual profiles and availability.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="text-sm text-white/60">Interactive map view</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
              <input
                type="checkbox"
                checked={distanceEnabled}
                onChange={(e) => setDistanceEnabled(e.target.checked)}
                disabled={!postcode}
                className="rounded border-white/20"
              />
              <span className="font-medium">Filter by distance</span>
            </label>

            {distanceEnabled && postcode && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-sm">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-32"
                />
                <div className="min-w-[4rem] text-right text-sm font-semibold tabular-nums">{distanceKm} km</div>
              </div>
            )}
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


