"use client";

import type { TeacherDetail } from "@/lib/api";

export function TeacherModal({
  open,
  onClose,
  teacher
}: {
  open: boolean;
  onClose: () => void;
  teacher: TeacherDetail | null;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-[0_22px_80px_-45px_rgba(0,0,0,0.95)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">
              {teacher?.profile.name ?? "Teacher"}
            </div>
            <div className="truncate text-sm text-white/70">
              {teacher?.profile.teaching_level ?? ""}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/15"
          >
            Close
          </button>
        </div>

        {!teacher ? (
          <div className="p-6 text-sm text-white/70">Loading…</div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={teacher.profile.profile_picture}
                  alt={teacher.profile.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white/70">Subjects / specialties</div>
                <div className="text-sm">{teacher.profile.subjects_specialties}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-white/70">Experience</div>
                    <div className="text-sm">{teacher.profile.years_of_experience} years</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/70">Qualifications</div>
                    <div className="text-sm">{teacher.profile.qualifications}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
              <div className="text-sm font-semibold">Contact</div>
              <div className="mt-2 flex flex-col gap-2">
                <a
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink-950 shadow-sm transition hover:bg-white/90"
                  href={`mailto:${teacher.contact.email_relay}`}
                >
                  Email teacher (relay)
                </a>
                {teacher.contact.phone_primary ? (
                  <a
                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold shadow-sm transition hover:bg-white/15"
                    href={`tel:${teacher.contact.phone_primary}`}
                  >
                    Call: {teacher.contact.phone_primary}
                  </a>
                ) : (
                  <div className="text-sm text-white/60">Phone not available.</div>
                )}
              </div>
              <div className="mt-3 text-xs text-white/50">
                Email relay is a Phase 1 placeholder.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


