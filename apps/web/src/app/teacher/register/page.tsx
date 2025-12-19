"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";

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
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white/90"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      <div className="mt-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Join Our Network</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
          Create your profile and start connecting with schools looking for qualified relief teachers.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_22px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur sm:p-8">
        {/* Enhanced Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-white/80">Step {step} of 5</span>
            <span className="text-white/50">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all duration-500"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            {["Account", "Profile", "Location", "Availability", "Review"].map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <div
                  key={label}
                  className={clsx(
                    "flex flex-col items-center gap-1 transition",
                    isActive ? "text-white" : isComplete ? "text-emerald-400" : "text-white/40"
                  )}
                >
                  <div
                    className={clsx(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-white text-ink-950"
                        : isComplete
                          ? "bg-emerald-400/20 text-emerald-400"
                          : "bg-white/5"
                    )}
                  >
                    {isComplete ? "✓" : stepNum}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        ) : null}

        {/* Steps */}
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Account Information</h3>
              <p className="mt-1 text-sm text-white/60">Create your account to get started</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/80">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">
                  Phone number <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone_primary ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone_primary: e.target.value }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="+61 4XX XXX XXX"
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Professional Profile</h3>
              <p className="mt-1 text-sm text-white/60">Tell schools about your teaching background</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">Full name</label>
                <input
                  value={form.profile.name}
                  onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, name: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Teaching level</label>
                <input
                  value={form.profile.teaching_level}
                  onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, teaching_level: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="Primary / Secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Years of experience</label>
                <input
                  type="number"
                  min={0}
                  value={form.profile.years_of_experience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, profile: { ...f.profile, years_of_experience: Number(e.target.value || 0) } }))
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">Subjects & specialties</label>
                <input
                  value={form.profile.subjects_specialties}
                  onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, subjects_specialties: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="Mathematics, Science, English"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">Qualifications</label>
                <input
                  value={form.profile.qualifications}
                  onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, qualifications: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="B.Ed, MTeach, Graduate Diploma"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">Profile picture URL</label>
                <input
                  value={form.profile.profile_picture}
                  onChange={(e) => setForm((f) => ({ ...f, profile: { ...f.profile, profile_picture: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="mt-2 text-xs text-white/50">Provide a professional photo URL</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Location & Service Area</h3>
              <p className="mt-1 text-sm text-white/60">Define where you're available to work</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-white/80">Country code</label>
                <input
                  value={form.location.country_code}
                  onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, country_code: e.target.value.toUpperCase() } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="AU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Postcode</label>
                <input
                  value={form.location.postcode}
                  onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, postcode: e.target.value } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80">Service radius (km)</label>
                <input
                  type="number"
                  min={1}
                  value={form.location.radius_km}
                  onChange={(e) => setForm((f) => ({ ...f, location: { ...f.location, radius_km: Number(e.target.value || 1) } }))}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none shadow-sm transition focus:border-white/30 focus:bg-white/5 focus:ring-2 focus:ring-white/10"
                  placeholder="15"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-4">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-sm text-blue-200/90">Your service radius determines how far you're willing to travel for relief teaching assignments.</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Weekly Availability</h3>
              <p className="mt-1 text-sm text-white/60">Select the days you're typically available to teach</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["mon", "Monday"],
                  ["tue", "Tuesday"],
                  ["wed", "Wednesday"],
                  ["thu", "Thursday"],
                  ["fri", "Friday"],
                  ["sat", "Saturday"],
                  ["sun", "Sunday"]
                ] as const
              ).map(([k, label]) => (
                <label
                  key={k}
                  className={clsx(
                    "group flex cursor-pointer items-center gap-3 rounded-xl border p-4 shadow-sm transition",
                    form.weekly_availability[k]
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.weekly_availability[k]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weekly_availability: { ...f.weekly_availability, [k]: e.target.checked } }))
                    }
                    className="h-4 w-4 rounded border-white/20"
                  />
                  <div className="flex-1">
                    <div className={clsx(
                      "text-sm font-medium transition",
                      form.weekly_availability[k] ? "text-emerald-200" : "text-white/80"
                    )}>
                      {label}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <p className="text-sm text-amber-200/90">You can update your daily availability anytime from your dashboard.</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Review Your Profile</h3>
              <p className="mt-1 text-sm text-white/60">Make sure everything looks correct before creating your account</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/90">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Account Details
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-white/50">Email</div>
                    <div className="mt-1 truncate text-sm text-white/90">{form.email || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/50">Phone</div>
                    <div className="mt-1 truncate text-sm text-white/90">{form.phone_primary || "Not provided"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/90">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  Professional Profile
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-white/50">Name</div>
                    <div className="mt-1 truncate text-sm text-white/90">{form.profile.name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/50">Teaching Level</div>
                    <div className="mt-1 truncate text-sm text-white/90">{form.profile.teaching_level}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/50">Experience</div>
                    <div className="mt-1 text-sm text-white/90">{form.profile.years_of_experience} years</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/50">Qualifications</div>
                    <div className="mt-1 truncate text-sm text-white/90">{form.profile.qualifications}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs font-medium text-white/50">Subjects & Specialties</div>
                    <div className="mt-1 text-sm text-white/90">{form.profile.subjects_specialties}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/90">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Location & Availability
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-white/50">Location</div>
                    <div className="mt-1 text-sm text-white/90">
                      {form.location.country_code} • {form.location.postcode} • {form.location.radius_km}km radius
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/50">Available Days</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(form.weekly_availability)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <span key={k} className="inline-flex items-center rounded-lg bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200">
                            {k.charAt(0).toUpperCase() + k.slice(1)}
                          </span>
                        ))}
                      {Object.values(form.weekly_availability).every(v => !v) && (
                        <span className="text-sm text-white/60">None selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 && (
            <button
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold shadow-sm transition hover:bg-white/10"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {step < 5 ? (
              <button
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-ink-950 shadow-lg transition hover:scale-105 hover:bg-white/95"
                onClick={() => setStep((s) => ((s + 1) as any))}
              >
                Continue
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-400 px-8 text-sm font-semibold text-ink-950 shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
                  {busy ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {token ? (
        <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-blue-400/5 p-8 shadow-[0_22px_70px_-30px_rgba(16,185,129,0.3)] backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Account Created Successfully!</h3>
              <p className="mt-2 text-base leading-relaxed text-white/70">
                Your teacher profile has been created. Complete your subscription to become discoverable to schools.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-sm">
                <div className="mb-3 text-sm font-semibold text-white/90">What's Next?</div>
                <ol className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">1</span>
                    <span>Activate your subscription below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">2</span>
                    <span>Set your availability in the dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">3</span>
                    <span>Schools can discover and contact you</span>
                  </li>
                </ol>
              </div>

              <button
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-400 px-8 text-sm font-semibold text-ink-950 shadow-lg transition hover:scale-105"
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
                Activate Subscription
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <Link
                href="/teacher/dashboard"
                className="mt-3 inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-semibold shadow-sm transition hover:bg-white/10"
              >
                Go to Dashboard
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              {result?.subscribe_result && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold text-white/80">
                      Response Details
                    </summary>
                    <pre className="mt-3 overflow-auto text-xs text-white/60">{JSON.stringify(result.subscribe_result, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


