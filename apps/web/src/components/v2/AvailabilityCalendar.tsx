"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTeacherCalendar, upsertTeacherCalendar, type CalendarEntry } from "@/lib/api_v2";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

export function AvailabilityCalendar() {
  const [cursorMonth, setCursorMonth] = useState(() => startOfMonth(new Date()));
  const [map, setMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const from = startOfMonth(cursorMonth);
    const to = endOfMonth(cursorMonth);
    return { from: isoDate(from), to: isoDate(to) };
  }, [cursorMonth]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTeacherCalendar(range.from, range.to)
      .then((rows) => {
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        for (const r of rows) next[r.date] = r.is_available;
        setMap(next);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to]);

  const days = useMemo(() => {
    const from = new Date(`${range.from}T00:00:00.000Z`);
    const to = new Date(`${range.to}T00:00:00.000Z`);
    const out: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(isoDate(d));
    return out;
  }, [range.from, range.to]);

  async function save(changes: CalendarEntry[]) {
    setLoading(true);
    setError(null);
    try {
      await upsertTeacherCalendar(changes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Availability calendar</div>
          <div className="text-xs text-white/60">Phase 2: date-specific availability</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
            onClick={() => setCursorMonth((d) => startOfMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))))}
          >
            Prev
          </button>
          <button
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
            onClick={() => setCursorMonth((d) => startOfMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))))}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/60">
        Range: <span className="font-mono">{range.from}</span> → <span className="font-mono">{range.to}</span>
      </div>

      {loading ? <div className="mt-3 text-sm text-white/70">Loading…</div> : null}
      {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}

      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const v = map[d] ?? false;
          return (
            <button
              key={d}
              className={[
                "rounded-xl border px-2 py-2 text-left text-xs",
                v ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-black/20 hover:bg-white/5"
              ].join(" ")}
              onClick={async () => {
                const next = !v;
                setMap((m) => ({ ...m, [d]: next }));
                await save([{ date: d, is_available: next }]);
              }}
              title={d}
            >
              <div className="font-mono">{d.slice(8, 10)}</div>
              <div className={v ? "text-emerald-200" : "text-white/50"}>{v ? "Available" : "Off"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


