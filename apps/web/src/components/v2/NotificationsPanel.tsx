"use client";

import { useEffect, useState } from "react";
import type { NotificationItem } from "@/lib/api_v2";

function labelForType(type: string): { title: string; description: string; icon: "job" | "system" | "info" } {
  switch (type) {
    case "job_alert":
      return { title: "Job alert", description: "A school is looking for relief cover. Check details and respond quickly.", icon: "job" };
    case "system_alert":
      return { title: "System alert", description: "An account or platform update that may require your attention.", icon: "system" };
    default:
      return { title: type, description: "Notification", icon: "info" };
  }
}

function Icon({ kind }: { kind: "job" | "system" | "info" }) {
  const common = "h-4 w-4";
  if (kind === "job") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
        <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M8 12h8" />
      </svg>
    );
  }
  if (kind === "system") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function NotificationsPanel({
  title,
  fetchNotifications,
  markRead
}: {
  title: string;
  fetchNotifications: (unreadOnly: boolean) => Promise<NotificationItem[]>;
  markRead: (id: string) => Promise<void>;
}) {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(unreadOnly: boolean) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(unreadOnly);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
            onClick={() => void load(true)}
          >
            Unread
          </button>
          <button
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
            onClick={() => void load(false)}
          >
            All
          </button>
        </div>
      </div>

      {loading ? <div className="mt-3 text-sm text-white/70">Loading…</div> : null}
      {error ? <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

      <div className="mt-3 space-y-2">
        {(items ?? []).length === 0 && !loading ? (
          <div className="text-sm text-white/60">No notifications.</div>
        ) : null}

        {(items ?? []).map((n) => (
          <div
            key={n.id}
            className={[
              "flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors",
              n.read_status === "unread" ? "border-amber-300/20 bg-amber-300/5" : "border-white/10 bg-black/20 hover:bg-white/5"
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "mt-0.5 grid h-8 w-8 place-items-center rounded-xl border",
                    n.read_status === "unread" ? "border-amber-300/30 bg-amber-300/10 text-amber-200" : "border-white/10 bg-white/5 text-white/70"
                  ].join(" ")}
                >
                  <Icon kind={labelForType(n.type).icon} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{labelForType(n.type).title}</div>
                    {n.read_status === "unread" ? (
                      <span className="inline-flex items-center rounded-full bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm text-white/70">{labelForType(n.type).description}</div>
                  <div className="mt-1 text-xs text-white/50">{formatTimestamp(n.timestamp)}</div>
                </div>
              </div>
            </div>
            {n.read_status === "unread" ? (
              <button
                className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-white/90"
                onClick={async () => {
                  // optimistic
                  setItems((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read_status: "read" } : x)));
                  try {
                    await markRead(n.id);
                  } catch (e) {
                    // revert
                    setItems((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read_status: "unread" } : x)));
                    setError(e instanceof Error ? e.message : "Failed to mark read");
                    return;
                  }
                }}
              >
                Mark read
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}


