"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountrySelector } from "@/components/v3/CountrySelector";
import { createEnterpriseSchool, getEnterpriseSchool, removeEnterpriseMember, upsertEnterpriseMember } from "@/lib/api_v3";

export default function EnterpriseDashboardStub() {
  const [adminToken, setAdminToken] = useState("");
  const [saved, setSaved] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState("");
  const [enterpriseJson, setEnterpriseJson] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [memberSchoolUserId, setMemberSchoolUserId] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    const t = window.localStorage.getItem("admin_access_token");
    if (t) setAdminToken(t);
  }, []);

  async function refresh() {
    if (!lookupId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const json = await getEnterpriseSchool(lookupId.trim());
      setEnterpriseJson(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setEnterpriseJson(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm font-semibold">Enterprise Dashboard (Phase 3 stub)</div>
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
            <div className="text-sm font-semibold">Admin token (stub)</div>
            <div className="mt-2 text-sm text-white/70">
              Paste an admin JWT to manage enterprise orgs.
            </div>
            <textarea
              value={adminToken}
              onChange={(e) => {
                setAdminToken(e.target.value);
                setSaved(false);
              }}
              rows={5}
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-xs outline-none focus:border-white/25"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90"
                onClick={() => {
                  window.localStorage.setItem("admin_access_token", adminToken.trim());
                  setSaved(true);
                }}
              >
                Save token
              </button>
              {saved ? <div className="text-sm text-white/70">Saved.</div> : null}
            </div>
            {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <div className="text-sm font-semibold">Enterprise org management (scaffold)</div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold">Create org</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enterprise name"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                  />
                  <button
                    disabled={!createName.trim() || busy}
                    className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        const json = await createEnterpriseSchool({ name: createName.trim() });
                        setCreatedId(json?.enterprise_school?.id ?? null);
                        setLookupId(json?.enterprise_school?.id ?? "");
                        setCreateName("");
                        setEnterpriseJson(json);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Create
                  </button>
                </div>
                {createdId ? <div className="mt-2 text-xs text-white/60">Created ID: {createdId}</div> : null}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold">Load org</div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="EnterpriseSchool ID"
                    className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-white/25"
                  />
                  <button
                    disabled={!lookupId.trim() || busy}
                    className="h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
                    onClick={() => void refresh()}
                  >
                    Load
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <input
                    value={memberSchoolUserId}
                    onChange={(e) => setMemberSchoolUserId(e.target.value)}
                    placeholder="School user ID"
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs outline-none focus:border-white/25"
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as any)}
                    className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs outline-none focus:border-white/25"
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      disabled={!lookupId.trim() || !memberSchoolUserId.trim() || busy}
                      className="h-10 flex-1 rounded-xl bg-white px-3 text-xs font-semibold text-ink-950 hover:bg-white/90 disabled:opacity-50"
                      onClick={async () => {
                        setBusy(true);
                        setError(null);
                        try {
                          await upsertEnterpriseMember({
                            enterpriseSchoolId: lookupId.trim(),
                            schoolUserId: memberSchoolUserId.trim(),
                            role: memberRole
                          });
                          await refresh();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Add/Update member
                    </button>
                    <button
                      disabled={!lookupId.trim() || !memberSchoolUserId.trim() || busy}
                      className="h-10 flex-1 rounded-xl bg-white/10 px-3 text-xs font-semibold hover:bg-white/15 disabled:opacity-50"
                      onClick={async () => {
                        setBusy(true);
                        setError(null);
                        try {
                          await removeEnterpriseMember({
                            enterpriseSchoolId: lookupId.trim(),
                            schoolUserId: memberSchoolUserId.trim()
                          });
                          await refresh();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Remove member
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs font-semibold text-white/80">Org JSON (scaffold)</div>
                  <pre className="mt-2 max-h-64 overflow-auto text-xs text-white/70">
                    {enterpriseJson ? JSON.stringify(enterpriseJson, null, 2) : "No org loaded."}
                  </pre>
                </div>

                <div className="mt-3 text-xs text-white/50">
                  Reporting + batch alerts endpoints are stubbed (501) in Phase 3 scaffolding.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


