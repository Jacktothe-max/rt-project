"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RegisterPayload = {
  email: string;
  password: string;
  phone_primary?: string;
  profile: {
    name: string;
    teaching_level: string;
    subjects_specialties: string;
    years_of_experience: number;
    qualifications: string;
    profile_picture: string;
  };
  location: {
    country_code: string;
    postcode: string;
    radius_km: number;
  };
  weekly_availability: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
};

export default function TeacherRegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const [form, setForm] = useState<RegisterPayload>(() => ({
    email: "",
    password: "",
    phone_primary: "",
    profile: {
      name: "",
      teaching_level: "Primary",
      subjects_specialties: "General",
      years_of_experience: 0,
      qualifications: "B.Ed",
      profile_picture: "https://placehold.co/256x256/png"
    },
    location: {
      country_code: "AU",
      postcode: "",
      radius_km: 15
    },
    weekly_availability: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false
    }
  }));

  const token = useMemo(() => (result?.accessToken ? String(result.accessToken) : null), [result]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-sm text-white/60">
        <Link href="/" className="underline decoration-white/20 underline-offset-4 hover:decoration-white/50">
          ← Back to map
        </Link>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Register as a Teacher</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        This form calls <span className="font-mono">POST /teachers/register</span> (Swagger source of truth) and stores the returned JWT in{" "}
        <span className="font-mono">localStorage.teacher_access_token</span>.
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
        {/* Stepper */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold tracking-tight">Step {step} of 5</div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className={step === 1 ? "text-white" : ""}>Account</span>
            <span>•</span>
            <span className={step === 2 ? "text-white" : ""}>Profile</span>
            <span>•</span>
            <span className={step === 3 ? "text-white" : ""}>Location</span>
            <span>•</span>
            <span className={step === 4 ? "text-white" : ""}>Availability</span>
            <span>•</span>
            <span className={step === 5 ? "text-white" : ""}>Review</span>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white/70 transition-all"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {error ? <div className="mb-4 text-sm text-red-200">{error}</div> : null}

        {/* Steps */}
        {step === 1 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-white/70">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="teacher@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="Min 8 chars"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/70">Phone (optional)</label>
              <input
                value={form.phone_primary ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone_primary: e.target.value }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="+61…"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/70">Full name</label>
              <input
                value={form.profile.name}
                onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, name: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Teaching level</label>
              <input
                value={form.profile.teaching_level}
                onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, teaching_level: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="Primary / Secondary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Years of experience</label>
              <input
                type="number"
                min={0}
                value={form.profile.years_of_experience}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profile: { ...f.profile, years_of_experience: Number(e.target.value || 0) } }))
                }
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/70">Subjects / specialties</label>
              <input
                value={form.profile.subjects_specialties}
                onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, subjects_specialties: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="Maths, English…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/70">Qualifications</label>
              <input
                value={form.profile.qualifications}
                onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, qualifications: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="B.Ed, MTeach…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-white/70">Profile picture URL</label>
              <input
                value={form.profile.profile_picture}
                onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, profile_picture: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="https://…"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-white/70">Country code</label>
              <input
                value={form.location.country_code}
                onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, country_code: e.target.value.toUpperCase() } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="AU"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Postcode</label>
              <input
                value={form.location.postcode}
                onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, postcode: e.target.value } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/70">Radius (km)</label>
              <input
                type="number"
                min={1}
                value={form.location.radius_km}
                onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, radius_km: Number(e.target.value || 1) } }))}
                className="mt-1 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm outline-none shadow-sm transition focus:border-white/25 focus:bg-white/5"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6">
            <div className="text-xs font-semibold text-white/70">Weekly availability</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["mon", "Mon"],
                  ["tue", "Tue"],
                  ["wed", "Wed"],
                  ["thu", "Thu"],
                  ["fri", "Fri"],
                  ["sat", "Sat"],
                  ["sun", "Sun"]
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm shadow-sm transition hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.weekly_availability[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weekly_availability: { ...f.weekly_availability, [k]: e.target.checked } }))
                    }
                  />
                  <span className="text-white/80">{label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4 shadow-sm">
            <div className="text-sm font-semibold">Review</div>
            <div className="mt-2 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
              <div>
                <div className="text-xs text-white/50">Email</div>
                <div className="truncate">{form.email || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Name</div>
                <div className="truncate">{form.profile.name || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Teaching level</div>
                <div className="truncate">{form.profile.teaching_level}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Subjects</div>
                <div className="truncate">{form.profile.subjects_specialties}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Location</div>
                <div className="truncate">
                  {form.location.country_code} • {form.location.postcode} • {form.location.radius_km}km
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50">Availability</div>
                <div className="truncate">
                  {Object.entries(form.weekly_availability)
                    .filter(([, v]) => v)
                    .map(([k]) => k.toUpperCase())
                    .join(", ") || "—"}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="h-12 rounded-2xl bg-white/10 px-5 text-sm font-semibold shadow-sm transition hover:bg-white/15 disabled:opacity-50"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
          >
            Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {step < 5 ? (
              <button
                className="h-12 rounded-2xl bg-white px-6 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90"
                onClick={() => setStep((s) => ((s + 1) as any))}
              >
                Continue
              </button>
            ) : (
              <button
                disabled={busy}
                className="h-12 rounded-2xl bg-white px-6 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90 disabled:opacity-50"
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  setResult(null);
                  try {
                    const res = await fetch("/backend/teachers/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...form,
                        phone_primary: form.phone_primary?.trim() ? form.phone_primary.trim() : undefined
                      })
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(json?.error ? String(json.error) : `Request failed (${res.status})`);
                    setResult(json);
                    if (json?.accessToken) {
                      window.localStorage.setItem("teacher_access_token", String(json.accessToken));
                      window.localStorage.setItem("any_access_token", String(json.accessToken));
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Registration failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Registering…" : "Create account"}
              </button>
            )}
            <Link
              href="/teacher/dashboard"
              className="h-12 rounded-2xl bg-white/10 px-6 text-center text-sm font-semibold leading-[48px] shadow-sm transition hover:bg-white/15"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>

      {token ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Next step: subscribe (stub)</div>
          <div className="mt-2 text-sm text-white/70">
            Registration does not create a subscription, so you’re not discoverable until you call <span className="font-mono">POST /teachers/subscribe</span>.
          </div>
          <button
            className="mt-4 h-11 rounded-xl bg-white px-5 text-sm font-semibold text-ink-950 hover:bg-white/90"
            onClick={async () => {
              setError(null);
              try {
                const res = await fetch("/backend/teachers/subscribe", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error ? String(json.error) : `Request failed (${res.status})`);
                setResult((r: any) => ({ ...(r ?? {}), subscribe_result: json }));
              } catch (e) {
                setError(e instanceof Error ? e.message : "Subscribe failed");
              }
            }}
          >
            Create subscription (stub)
          </button>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
            <div className="font-semibold text-white/80">Response (debug)</div>
            <pre className="mt-2 overflow-auto">{JSON.stringify(result?.subscribe_result ?? {}, null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}


