"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvailabilityCalendar } from "@/components/v2/AvailabilityCalendar";
import { WeekAvailabilityStrip } from "@/components/v2/WeekAvailabilityStrip";
import { NotificationsPanel } from "@/components/v2/NotificationsPanel";
import { activateTeacherBoost, fetchTeacherBoostStatus, fetchTeacherNotifications, markTeacherNotificationRead } from "@/lib/api_v2";
import { fetchTeacherSubscriptionV3 } from "@/lib/api_v3";
import { TierBadge } from "@/components/v3/TierBadge";
import { CountrySelector } from "@/components/v3/CountrySelector";

export default function TeacherDashboardPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [boostStatus, setBoostStatus] = useState<{ enabled: boolean; expires_at: string | null } | null>(null);
  const [boostError, setBoostError] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; profilePicture: string } | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem("teacher_access_token");
    if (existing) setToken(existing);
  }, []);

  const hasToken = !!token.trim();

  useEffect(() => {
    if (!hasToken) return;
    let cancelled = false;
    fetch("/backend/teachers/me/profile", {
      headers: { Authorization: `Bearer ${token.trim()}` }
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return await r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const p = json?.profile;
        if (p?.name && p?.profilePicture) setProfile({ name: String(p.name), profilePicture: String(p.profilePicture) });
        else setProfile(null);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken, token]);

  useEffect(() => {
    if (!hasToken) return;
    let cancelled = false;
    fetchTeacherSubscriptionV3()
      .then((s) => {
        if (cancelled) return;
        setTier(`Teacher ${s.tier}`);
      })
      .catch(() => {
        if (cancelled) return;
        setTier(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className={[
                  "h-9 w-9 overflow-hidden rounded-full border bg-white/5 shadow-sm",
                  boostStatus?.enabled ? "border-amber-300/70" : "border-white/15"
                ].join(" ")}
                title={boostStatus?.enabled ? "Boost active" : "Boost inactive"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {profile?.profilePicture ? <img src={profile.profilePicture} alt={profile.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">Teacher Dashboard</div>
                <div className="text-xs text-white/60">Availability • Notifications • Boost</div>
              </div>
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
                Paste a teacher JWT so the dashboard can call <span className="font-mono">/teachers/v2/*</span>.
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
                    window.localStorage.setItem("teacher_access_token", token.trim());
                    window.localStorage.setItem("any_access_token", token.trim());
                    setSaved(true);
                  }}
                >
                  Save token
                </button>
                {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
              <div className="text-sm font-semibold">Profile boost (stub)</div>
              <div className="mt-2 text-sm text-white/70">
                Phase 2 stub: activates a boost flag on your latest subscription (no payments yet).
              </div>
              {boostError ? <div className="mt-2 text-sm text-red-200">{boostError}</div> : null}
              {boostStatus ? (
                <div className="mt-3 text-sm text-white/70">
                  Status: <span className="font-semibold">{boostStatus.enabled ? "Enabled" : "Disabled"}</span>
                  <div className="mt-1 text-xs text-white/50">
                    Active until: {boostStatus.expires_at ? new Date(boostStatus.expires_at).toLocaleString() : "—"}
                  </div>
                </div>
              ) : null}
              <button
                disabled={!hasToken}
                className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/15 disabled:opacity-50"
                onClick={async () => {
                  setBoostError(null);
                  try {
                    const s = await fetchTeacherBoostStatus();
                    setBoostStatus({ enabled: s.enabled, expires_at: s.active_until });
                  } catch (e) {
                    setBoostError(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                Refresh boost status
              </button>
              <button
                disabled={!hasToken}
                className="mt-4 w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90 disabled:opacity-50"
                onClick={async () => {
                  setBoostError(null);
                  try {
                    const s = await activateTeacherBoost();
                    setBoostStatus({ enabled: s.enabled, expires_at: s.active_until });
                  } catch (e) {
                    setBoostError(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                Activate boost
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <WeekAvailabilityStrip />
            <AvailabilityCalendar />
            <NotificationsPanel
              title="Notifications"
              fetchNotifications={fetchTeacherNotifications}
              markRead={markTeacherNotificationRead}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


