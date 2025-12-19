"use client";

import clsx from "clsx";

export function TierBadge({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const isPro = lower.includes("pro");
  const isEnterprise = lower.includes("enterprise");

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        isEnterprise
          ? "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100"
          : isPro
            ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
            : "border-white/10 bg-white/5 text-white/80"
      )}
    >
      {label}
    </span>
  );
}


