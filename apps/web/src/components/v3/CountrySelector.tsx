"use client";

import { useEffect, useState } from "react";

const COUNTRIES = [
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" }
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function CountrySelector({ onChange }: { onChange?: (country: CountryCode) => void }) {
  const [country, setCountry] = useState<CountryCode>("AU");

  useEffect(() => {
    const saved = window.localStorage.getItem("country_code") as CountryCode | null;
    if (saved && COUNTRIES.some((c) => c.code === saved)) setCountry(saved);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-xs font-medium text-white/60 sm:block">Country</div>
      <select
        value={country}
        aria-label="Country"
        onChange={(e) => {
          const v = e.target.value as CountryCode;
          setCountry(v);
          window.localStorage.setItem("country_code", v);
          onChange?.(v);
        }}
        className="h-9 rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm outline-none shadow-sm transition-colors focus:border-white/25 focus:bg-white/10"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}


