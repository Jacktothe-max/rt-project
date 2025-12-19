"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addSchoolFavourite, fetchSchoolFavourites, fetchSchoolNotifications, markSchoolNotificationRead, removeSchoolFavourite, type FavouriteItem } from "@/lib/api_v2";
import { NotificationsPanel } from "@/components/v2/NotificationsPanel";
import { fetchTeacherDetail } from "@/lib/api";
import { TeacherModal } from "@/components/TeacherModal";
import { fetchSchoolSubscriptionV3 } from "@/lib/api_v3";
import { TierBadge } from "@/components/v3/TierBadge";
import { CountrySelector } from "@/components/v3/CountrySelector";
import { MapDiscovery } from "@/components/MapDiscovery";
import { fakeGeocode } from "@/lib/fakeGeocode";

export default function SchoolDashboardPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [favourites, setFavourites] = useState<FavouriteItem[] | null>(null);
  const [favError, setFavError] = useState<string | null>(null);
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [tier, setTier] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Map (Phase 1 + Phase 2 overlay)
  const [postcodeInput, setPostcodeInput] = useState("");
  const [postcode, setPostcode] = useState<string | null>(null);
  const [distanceEnabled, setDistanceEnabled] = useState(false);
  const [distanceKm, setDistanceKm] = useState(15);

  useEffect(() => {
    const existing = window.localStorage.getItem("school_access_token");
    if (existing) setToken(existing);
  }, []);

  const hasToken = !!token.trim();

  useEffect(() => {
    if (!hasToken) return;
    let cancelled = false;
    fetchSchoolSubscriptionV3()
      .then((s) => {
        if (cancelled) return;
        setTier(`School ${s.tier}`);
      })
      .catch(() => {
        if (cancelled) return;
        setTier(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  async function loadFavourites() {
    setFavError(null);
    try {
      const rows = await fetchSchoolFavourites();
      setFavourites(rows);
    } catch (e) {
      setFavError(e instanceof Error ? e.message : "Failed to load favourites");
      setFavourites(null);
    }
  }

  useEffect(() => {
    void loadFavourites();
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) return;
    let cancelled = false;
    setSelectedTeacher(null);
    fetchTeacherDetail(selectedTeacherId)
      .then((d) => {
        if (cancelled) return;
        setSelectedTeacher(d);
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedTeacher(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTeacherId]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">School Dashboard</div>
              <div className="hidden text-xs text-white/60 sm:block">Map • Favourites • Notifications</div>
            </div>
            {tier ? <TierBadge label={tier} /> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CountrySelector />
            <Link href="/teacher/register" className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/15">
              Register as a Teacher
            </Link>
            <Link href="/school/register" className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/15">
              Browse as a School
            </Link>
            <Link href="/" className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90">
              Phase 1 map
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
              <div className="text-sm font-semibold">Auth token (stub)</div>
              <div className="mt-2 text-sm text-white/70">
                Paste a school JWT to use favourites + notifications (Phase 2 endpoints).
              </div>
              <textarea
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setSaved(false);
                }}
                rows={5}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-xs outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90"
                  onClick={() => {
                    window.localStorage.setItem("school_access_token", token.trim());
                    window.localStorage.setItem("any_access_token", token.trim());
                    setSaved(true);
                    void loadFavourites();
                  }}
                >
                  Save token
                </button>
                {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Discovery map</div>
                  <div className="text-xs text-white/60">
                    Phase 1 heatmap/clusters + Phase 2 boosted highlighting (frontend-only sorting).
                  </div>
                </div>
                <Link
                  href="/v3/map"
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/15"
                >
                  Open Phase 3 map
                </Link>
              </div>

              <form
                className="mt-4 flex w-full flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = postcodeInput.trim();
                  if (!v) return;
                  setPostcode(v);
                }}
              >
                <input
                  value={postcodeInput}
                  onChange={(e) => setPostcodeInput(e.target.value)}
                  placeholder="Enter postcode"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm shadow-sm outline-none transition placeholder:text-white/40 focus:border-white/25 focus:bg-white/5"
                />
                <button type="submit" className="h-12 rounded-2xl bg-white px-6 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90">
                  View
                </button>
              </form>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-white/50">
                  Token required: map calls <span className="font-mono">/schools/teachers</span>.
                </div>
                <div className="flex items-center gap-3">
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

              <div className="mt-4">
                <MapDiscovery
                  postcode={postcode}
                  center={postcode ? fakeGeocode(postcode, "school-dashboard") : null}
                  maxDistanceKm={distanceEnabled && postcode ? distanceKm : null}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Saved teachers</div>
                  <div className="text-xs text-white/60">Only teachers currently discoverable are shown.</div>
                </div>
                <button
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/15"
                  onClick={() => void loadFavourites()}
                >
                  Refresh
                </button>
              </div>

              {favError ? <div className="mt-3 text-sm text-red-200">{favError}</div> : null}
              {!favourites ? <div className="mt-3 text-sm text-white/70">Loading…</div> : null}

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm">
                <div className="text-xs font-semibold text-white/80">Add favourite (Phase 2 QA helper)</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={addTeacherId}
                    onChange={(e) => setAddTeacherId(e.target.value)}
                    placeholder="Teacher user ID"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-xs shadow-sm outline-none transition focus:border-white/25 focus:bg-white/5"
                  />
                  <button
                    disabled={!addTeacherId.trim() || addBusy}
                    className="h-11 rounded-2xl bg-white px-4 text-xs font-semibold text-ink-950 shadow-sm transition hover:bg-white/90 disabled:opacity-50"
                    onClick={async () => {
                      setFavError(null);
                      setAddBusy(true);
                      try {
                        await addSchoolFavourite(addTeacherId.trim());
                        setAddTeacherId("");
                        await loadFavourites();
                      } catch (e) {
                        setFavError(e instanceof Error ? e.message : "Failed to add favourite");
                      } finally {
                        setAddBusy(false);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Note: adding only works for teachers who are currently discoverable (backend enforces visibility).
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {(favourites ?? []).length === 0 ? (
                  <div className="text-sm text-white/60">No saved teachers yet.</div>
                ) : null}

                {(favourites ?? []).map((t) => (
                  <div key={t.teacherUserId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 shadow-sm transition hover:bg-white/5">
                    <button
                      className="min-w-0 text-left"
                      onClick={() => {
                        setSelectedTeacherId(t.teacherUserId);
                        setModalOpen(true);
                      }}
                    >
                      <div className="truncate text-sm font-semibold">{t.name}</div>
                      <div className="truncate text-xs text-white/60">{t.teaching_level}</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/15"
                        onClick={async () => {
                          await removeSchoolFavourite(t.teacherUserId);
                          await loadFavourites();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/50">
                Add/remove favourites from the Phase 2 map page (see <span className="font-mono">/v2</span>).
              </div>
            </div>

            <NotificationsPanel
              title="Alerts"
              fetchNotifications={fetchSchoolNotifications}
              markRead={markSchoolNotificationRead}
            />
          </div>
        </div>
      </div>

      <TeacherModal
        open={modalOpen}
        teacher={selectedTeacher}
        onClose={() => {
          setModalOpen(false);
          setSelectedTeacherId(null);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}


