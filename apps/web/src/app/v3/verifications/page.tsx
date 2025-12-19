"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountrySelector } from "@/components/v3/CountrySelector";
import { adminDecideCredentialVerification, fetchMyCredentialVerifications, submitCredentialVerification, type CredentialVerificationItem } from "@/lib/api_v3";

export default function VerificationsStub() {
  const [teacherToken, setTeacherToken] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedAdmin, setSavedAdmin] = useState(false);

  const [type, setType] = useState("teacher_registration");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<CredentialVerificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [decideId, setDecideId] = useState("");
  const [decideStatus, setDecideStatus] = useState<"approved" | "rejected">("approved");
  const [decideNotes, setDecideNotes] = useState("");

  useEffect(() => {
    const t = window.localStorage.getItem("teacher_access_token");
    if (t) setTeacherToken(t);
    const a = window.localStorage.getItem("admin_access_token");
    if (a) setAdminToken(a);
  }, []);

  async function loadMine() {
    setBusy(true);
    setError(null);
    try {
      const data = await fetchMyCredentialVerifications();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Credential Verification (Phase 3 stub)</div>
          <div className="flex items-center gap-2">
            <CountrySelector />
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
            <div className="text-sm font-semibold">Teacher token (stub)</div>
            <div className="mt-2 text-sm text-white/70">
              Uses <span className="font-mono">/v3/teacher/me/credential-verifications</span>.
            </div>
            <textarea
              value={teacherToken}
              onChange={(e) => {
                setTeacherToken(e.target.value);
                setSaved(false);
              }}
              rows={4}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none focus:border-white/25"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
                onClick={() => {
                  window.localStorage.setItem("teacher_access_token", teacherToken.trim());
                  setSaved(true);
                }}
              >
                Save
              </button>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                onClick={() => void loadMine()}
                disabled={busy}
              >
                Refresh
              </button>
              {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
            </div>

            <div className="mt-6 text-sm font-semibold">Admin token (stub)</div>
            <div className="mt-2 text-sm text-white/70">
              Uses <span className="font-mono">/v3/credential-verifications/:id/decide</span>.
            </div>
            <textarea
              value={adminToken}
              onChange={(e) => {
                setAdminToken(e.target.value);
                setSavedAdmin(false);
              }}
              rows={4}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none focus:border-white/25"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
                onClick={() => {
                  window.localStorage.setItem("admin_access_token", adminToken.trim());
                  setSavedAdmin(true);
                }}
              >
                Save
              </button>
              {savedAdmin ? <div className="text-sm text-white/70">Saved.</div> : null}
            </div>

            {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Submit verification (teacher)</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                >
                  <option value="teacher_registration">teacher_registration</option>
                  <option value="working_with_children">working_with_children</option>
                  <option value="other">other</option>
                </select>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25 sm:col-span-2"
                />
              </div>
              <button
                className="mt-4 h-10 rounded-xl bg-white px-4 text-sm font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                disabled={busy || !teacherToken.trim()}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    window.localStorage.setItem("teacher_access_token", teacherToken.trim());
                    await submitCredentialVerification({ type, notes: notes.trim() ? notes.trim() : undefined });
                    setNotes("");
                    await loadMine();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Submit
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">My requests</div>
              <div className="mt-3 space-y-2">
                {rows === null ? <div className="text-sm text-white/60">Click Refresh to load.</div> : null}
                {(rows ?? []).map((v) => (
                  <div key={v.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs text-white/60">ID: {v.id}</div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{v.type}</div>
                      <div className="text-xs text-white/70">{v.status}</div>
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      Submitted: {new Date(v.submittedAt).toLocaleString()}
                      {v.decidedAt ? ` • Decided: ${new Date(v.decidedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Admin decision (scaffold)</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  value={decideId}
                  onChange={(e) => setDecideId(e.target.value)}
                  placeholder="Verification ID"
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25 sm:col-span-2"
                />
                <select
                  value={decideStatus}
                  onChange={(e) => setDecideStatus(e.target.value as any)}
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                >
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                <input
                  value={decideNotes}
                  onChange={(e) => setDecideNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25 sm:col-span-3"
                />
              </div>
              <button
                className="mt-4 h-10 rounded-xl bg-white px-4 text-sm font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                disabled={busy || !adminToken.trim() || !decideId.trim()}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    window.localStorage.setItem("admin_access_token", adminToken.trim());
                    await adminDecideCredentialVerification({
                      id: decideId.trim(),
                      status: decideStatus,
                      notes: decideNotes.trim() ? decideNotes.trim() : undefined
                    });
                    setDecideNotes("");
                    // Teacher can refresh their list after an admin decision.
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Submit decision
              </button>
              <div className="mt-3 text-xs text-white/50">
                After approval/rejection, the status will appear in Phase 3 teacher modals via `/schools/v3/teachers/:id`.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


