"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTeacherCalendar, upsertTeacherCalendar } from "@/lib/api_v2";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // to Monday
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function WeekAvailabilityStrip() {
  const weekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const days = useMemo(() => DOW.map((label, i) => ({ label, date: isoDate(addDays(weekStart, i)) })), [weekStart]);

  const [map, setMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const from = days[0]?.date;
    const to = days[days.length - 1]?.date;
    if (!from || !to) return;
    fetchTeacherCalendar(from, to)
      .then((rows) => {
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        for (const r of rows) next[r.date] = r.is_available;
        setMap(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  async function toggle(date: string) {
    setError(null);
    const nextValue = !(map[date] ?? false);
    setSaving((s) => ({ ...s, [date]: true }));
    // optimistic
    setMap((m) => ({ ...m, [date]: nextValue }));
    try {
      await upsertTeacherCalendar([{ date, is_available: nextValue }]);
    } catch (e) {
      // revert
      setMap((m) => ({ ...m, [date]: !(m[date] ?? false) }));
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving((s) => ({ ...s, [date]: false }));
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">This week</div>
          <div className="text-xs text-white/60">
            Monday → Sunday. Click a day to toggle availability.{" "}
            <span className="text-yellow-200/80">Yellow = saving</span>.
          </div>
        </div>
      </div>

      {error ? <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-7">
        {days.map((d) => {
          const isSaving = !!saving[d.date];
          const v = map[d.date] ?? false;
          const cls = isSaving
            ? "border-yellow-300/30 bg-yellow-300/10"
            : v
              ? "border-emerald-400/40 bg-emerald-400/10"
              : "border-white/10 bg-black/20 hover:bg-white/5";

          return (
            <button
              key={d.date}
              className={["rounded-xl border px-3 py-3 text-left transition-colors", cls].join(" ")}
              onClick={() => void toggle(d.date)}
              title={d.date}
            >
              <div className="text-xs font-semibold text-white/80">{d.label}</div>
              <div className="mt-1 font-mono text-xs text-white/60">{d.date.slice(5)}</div>
              <div className="mt-2 text-xs">
                {isSaving ? (
                  <span className="text-yellow-200">Saving…</span>
                ) : v ? (
                  <span className="text-emerald-200">Available</span>
                ) : (
                  <span className="text-white/50">Unavailable</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}





