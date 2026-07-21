"use client";

import { eraOptions, type EraFilter } from "@/lib/eraFilter";

type Props = {
  value: EraFilter;
  onChange: (value: EraFilter) => void;
};

export function EraNavigator({ value, onChange }: Props) {
  const options = eraOptions();
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const current = options[index] ?? options[0];
  const canPrev = index > 0;
  const canNext = index < options.length - 1;

  return (
    <nav
      dir="ltr"
      className="flex flex-col items-center gap-1 py-1"
      aria-label="בחירת תקופת חיים"
    >
      <p className="text-xs text-text-secondary" dir="rtl">
        תקופת חיים
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onChange(options[index - 1]!.value)}
          disabled={!canPrev}
          aria-label="תקופה קודמת"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-card text-lg text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition enabled:hover:border-indigo/40 enabled:hover:text-indigo disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <p
          dir="rtl"
          className="min-w-[9rem] text-center text-base font-semibold text-text-primary"
        >
          {current?.label ?? "—"}
        </p>
        <button
          type="button"
          onClick={() => onChange(options[index + 1]!.value)}
          disabled={!canNext}
          aria-label="תקופה הבאה"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-card text-lg text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition enabled:hover:border-indigo/40 enabled:hover:text-indigo disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
