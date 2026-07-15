"use client";

import type { EraFilter, EraOption } from "@/lib/eraFilter";

type Props = {
  value: EraFilter;
  options: EraOption[];
  onChange: (value: EraFilter) => void;
};

/** Compact era control — pairs with TimeframeSelect in chart card headers. */
export function EraSelect({ value, options, onChange }: Props) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">תקופת חיים</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as EraFilter)}
        className="appearance-none rounded-full border border-black/10 bg-page py-1.5 pe-7 ps-3 text-xs font-medium text-text-primary outline-none transition hover:border-indigo/40 focus:border-indigo"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary"
      >
        ▾
      </span>
    </label>
  );
}
