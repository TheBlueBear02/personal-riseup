"use client";

import type { Timeframe, TimeframeOption } from "@/lib/timeframe";

type Props = {
  value: Timeframe;
  options: TimeframeOption[];
  onChange: (value: Timeframe) => void;
};

/** Compact timeframe control — sits at the visual top-left of chart cards (RTL). */
export function TimeframeSelect({ value, options, onChange }: Props) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">טווח זמן</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Timeframe)}
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
