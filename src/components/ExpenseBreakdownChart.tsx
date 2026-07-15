"use client";

import { useState } from "react";
import {
  AllocationPieCard,
  buildAllocationSlices,
} from "@/components/AllocationPieCard";
import type { MonthPoint } from "@/lib/types";
import {
  aggregateExpenseBreakdown,
  defaultExpensePeriod,
  expensePeriodOptions,
  pointsForExpensePeriod,
} from "@/lib/expensePeriod";

type Props = {
  data: MonthPoint[];
};

function PeriodSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative inline-flex min-w-0 max-w-[12rem] shrink-0 items-center sm:max-w-[14rem]">
      <span className="sr-only">תקופה</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none truncate rounded-full border border-black/10 bg-page py-1.5 pe-7 ps-3 text-xs font-medium text-text-primary outline-none transition hover:border-indigo/40 focus:border-indigo"
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

export function ExpenseBreakdownChart({ data }: Props) {
  const options = expensePeriodOptions(data);
  const [period, setPeriod] = useState(() => defaultExpensePeriod(options));

  const selected =
    options.find((o) => o.value === period) ?? options[0] ?? null;
  const effectivePeriod = selected?.value ?? period;

  const points = pointsForExpensePeriod(data, effectivePeriod);
  const { items, total } = aggregateExpenseBreakdown(points);
  const slices = buildAllocationSlices(items, total);

  const subtitle = selected
    ? `פירוט סוגי הוצאות · ${selected.label}`
    : "פירוט סוגי הוצאות";

  return (
    <AllocationPieCard
      title="הרכב הוצאות"
      subtitle={subtitle}
      chartLabel="expense-breakdown"
      emptyMessage="אין נתוני פירוט הוצאות להצגה"
      totalLabel="סה״כ הוצאות"
      total={total}
      slices={slices}
      headerRight={
        options.length > 0 ? (
          <PeriodSelect
            value={effectivePeriod}
            options={options}
            onChange={setPeriod}
          />
        ) : undefined
      }
    />
  );
}
