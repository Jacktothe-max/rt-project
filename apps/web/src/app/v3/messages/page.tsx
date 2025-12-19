"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountrySelector } from "@/components/v3/CountrySelector";
import { fetchTeacherDetailV3, fetchInboxV3, fetchSentV3, markMessageReadV3, sendMessageV3, type MessageItem } from "@/lib/api_v3";

export default function MessagesStub() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inbox, setInbox] = useState<MessageItem[] | null>(null);
  const [sent, setSent] = useState<MessageItem[] | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [countryCode, setCountryCode] = useState(() => (typeof window === "undefined" ? "AU" : window.localStorage.getItem("country_code") || "AU"));

  useEffect(() => {
    const existing = window.localStorage.getItem("any_access_token");
    if (existing) setToken(existing);
  }, []);

  async function loadInbox() {
    setLoadingInbox(true);
    setError(null);
    try {
      const rows = await fetchInboxV3();
      setInbox(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
      setInbox(null);
    } finally {
      setLoadingInbox(false);
    }
  }

  async function loadSent() {
    setLoadingSent(true);
    setError(null);
    try {
      const rows = await fetchSentV3();
      setSent(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sent");
      setSent(null);
    } finally {
      setLoadingSent(false);
    }
  }

  useEffect(() => {
    // Phase 3 "near-real-time" refresh: poll inbox/sent when a token is present.
    if (!token.trim()) return;
    void loadInbox();
    void loadSent();
    const id = window.setInterval(() => {
      void loadInbox();
      void loadSent();
    }, 5000);
    return () => window.clearInterval(id);
  }, [token]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Messaging (Phase 3 stub)</div>
          <div className="flex items-center gap-2">
            <CountrySelector onChange={(c) => setCountryCode(c)} />
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
            <div className="text-sm font-semibold">Auth token (stub)</div>
            <div className="mt-2 text-sm text-white/70">
              Paste any valid JWT (teacher/school/admin) to call Phase 3 messaging endpoints.
            </div>
            <textarea
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setSaved(false);
              }}
              rows={5}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none focus:border-white/25"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
                onClick={() => {
                  window.localStorage.setItem("any_access_token", token.trim());
                  setSaved(true);
                }}
              >
                Save token
              </button>
              {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
            </div>
            {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Send message</div>
              <div className="mt-2 text-sm text-white/70">
                Discoverability guard (school → teacher): this UI checks `GET /schools/v3/teachers/:id?country_code=...` before sending.
              </div>
              <div className="mt-4 grid gap-3">
                <input
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  placeholder="Receiver user ID (UUID)"
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Message"
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-white/25"
                />
                <button
                  disabled={!receiverId.trim() || !content.trim() || sending}
                  className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                  onClick={async () => {
                    setSending(true);
                    setError(null);
                    try {
                      // If a school token exists, enforce discoverability check as a guard.
                      const schoolToken = window.localStorage.getItem("school_access_token");
                      if (schoolToken) {
                        await fetchTeacherDetailV3({ teacherUserId: receiverId.trim(), country_code: countryCode });
                      }

                      await sendMessageV3({ receiver_id: receiverId.trim(), content: content.trim(), country_code: countryCode });
                      setContent("");
                      await loadSent();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to send");
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Inbox</div>
                  <button
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    disabled={loadingInbox}
                    onClick={() => void loadInbox()}
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {loadingInbox ? <div className="text-sm text-white/70">Loading…</div> : null}
                  {(inbox ?? []).map((m) => (
                    <div key={m.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/60">From: {m.senderId}</div>
                      <div className="mt-1 text-sm">{m.content}</div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/50">
                        <div>{new Date(m.createdAt).toLocaleString()}</div>
                        {m.readAt ? (
                          <div>Read</div>
                        ) : (
                          <button
                            className="rounded-lg bg-white/10 px-2 py-1 font-semibold hover:bg-white/15"
                            onClick={async () => {
                              await markMessageReadV3(m.id);
                              await loadInbox();
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!loadingInbox && inbox && inbox.length === 0 ? <div className="text-sm text-white/60">No messages.</div> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Sent</div>
                  <button
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
                    disabled={loadingSent}
                    onClick={() => void loadSent()}
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {loadingSent ? <div className="text-sm text-white/70">Loading…</div> : null}
                  {(sent ?? []).map((m) => (
                    <div key={m.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/60">To: {m.receiverId}</div>
                      <div className="mt-1 text-sm">{m.content}</div>
                      <div className="mt-2 text-xs text-white/50">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                  {!loadingSent && sent && sent.length === 0 ? <div className="text-sm text-white/60">No messages.</div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


