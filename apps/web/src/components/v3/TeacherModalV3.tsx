"use client";

import type { TeacherDetailV3 } from "@/lib/api_v3";
import { TierBadge } from "@/components/v3/TierBadge";

export function TeacherModalV3({
  open,
  onClose,
  teacher
}: {
  open: boolean;
  onClose: () => void;
  teacher: TeacherDetailV3 | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{teacher?.profile.name ?? "Teacher"}</div>
            <div className="truncate text-sm text-white/70">{teacher?.profile.teaching_level ?? ""}</div>
          </div>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">
            Close
          </button>
        </div>

        {!teacher ? (
          <div className="p-6 text-sm text-white/70">Loading…</div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-xl bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teacher.profile.profile_picture} alt={teacher.profile.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white/70">Subjects / specialties</div>
                  <div className="text-sm">{teacher.profile.subjects_specialties}</div>
                  <div className="mt-3 text-sm text-white/70">Qualifications</div>
                  <div className="text-sm">{teacher.profile.qualifications}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <TierBadge label={`Teacher ${teacher.subscription.tier}`} />
                {teacher.subscription.is_boosted ? <TierBadge label="Boosted" /> : null}
                {!teacher.subscription.is_boosted && teacher.subscription.is_priority ? <TierBadge label="Priority" /> : null}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Credential verification</div>
              <div className="mt-2 space-y-2">
                {teacher.credential_verification.latest_by_type.length === 0 ? (
                  <div className="text-sm text-white/60">No verification submissions yet.</div>
                ) : (
                  teacher.credential_verification.latest_by_type.map((v) => (
                    <div key={v.type} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-sm">{v.type}</div>
                      <div className="text-xs text-white/70">{v.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Contact</div>
              <div className="mt-2 flex flex-col gap-2">
                <a className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-white/90" href={`mailto:${teacher.contact.email_relay}`}>
                  Email teacher (relay)
                </a>
                {teacher.contact.phone_primary ? (
                  <a className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15" href={`tel:${teacher.contact.phone_primary}`}>
                    Call: {teacher.contact.phone_primary}
                  </a>
                ) : (
                  <div className="text-sm text-white/60">Phone not available.</div>
                )}
              </div>
              <div className="mt-3 text-xs text-white/50">Email relay is a placeholder.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


