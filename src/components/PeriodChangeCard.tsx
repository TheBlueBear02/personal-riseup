"use client";

import { useState } from "react";
import { EraSelect } from "@/components/EraSelect";
import {
  formatIls,
  formatIlsChange,
  formatPercent,
  signColorClass,
} from "@/lib/format";
import type { MonthPoint } from "@/lib/types";
import {
  DEFAULT_ERA,
  eraOptions,
  filterByEra,
  type EraFilter,
} from "@/lib/eraFilter";
import {
  DEFAULT_PERIOD,
  PERIOD_OPTIONS,
  computePeriodChange,
  type PeriodOption,
} from "@/lib/periodChange";

type Props = {
  data: MonthPoint[];
};

function PeriodSelect({
  value,
  options,
  onChange,
}: {
  value: number | "all";
  options: PeriodOption[];
  onChange: (value: number | "all") => void;
}) {
  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">תקופה</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "all" ? "all" : Number(raw));
        }}
        className="appearance-none rounded-full border border-black/10 bg-page py-1.5 pe-7 ps-3 text-xs font-medium text-text-primary outline-none transition hover:border-indigo/40 focus:border-indigo"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
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

export function PeriodChangeCard({ data }: Props) {
  const [era, setEra] = useState<EraFilter>(DEFAULT_ERA);
  const [period, setPeriod] = useState<number | "all">(DEFAULT_PERIOD);
  const eraOpts = eraOptions();
  const scoped = filterByEra(data, era);
  const result = computePeriodChange(scoped, period);

  const statement =
    result.netWorthChange == null
      ? "אין מספיק נתונים לתקופה"
      : result.netWorthChange > 0
        ? "הרווחת בתקופה"
        : result.netWorthChange < 0
          ? "הפסדת בתקופה"
          : "ללא שינוי בתקופה";

  const periodHint =
    period === "all"
      ? `כל התקופה · ${result.monthsUsed} חודשים`
      : result.monthsUsed < period
        ? `${result.monthsUsed} חודשים במעקב (מתוך ${period})`
        : `${period} חודשים אחרונים`;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">רווח / הפסד בתקופה</h3>
          <p className="mt-1 text-sm text-text-secondary">{periodHint}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EraSelect value={era} options={eraOpts} onChange={setEra} />
          <PeriodSelect value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />
        </div>
      </div>

      <p className="mt-4 text-sm text-text-secondary">{statement}</p>
      <p
        className={`mt-2 text-4xl font-bold tracking-tight sm:text-5xl ${signColorClass(result.netWorthChange)}`}
      >
        {formatIlsChange(result.netWorthChange)}
      </p>
      {result.netWorthChangePct != null && (
        <p className={`mt-1 text-sm font-medium ${signColorClass(result.netWorthChange)}`}>
          {formatPercent(result.netWorthChangePct)} בשווי נקי
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/5 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-text-secondary">סכום תזרים</p>
          <p className={`mt-1 text-lg font-semibold ${signColorClass(result.cashflowSum)}`}>
            {formatIlsChange(result.cashflowSum)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">סה״כ הכנסות</p>
          <p className="mt-1 text-lg font-semibold text-green">
            {result.incomeSum != null ? formatIls(result.incomeSum) : "—"}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-text-secondary">סה״כ הוצאות</p>
          <p className="mt-1 text-lg font-semibold text-coral">
            {result.expensesSum != null ? formatIls(result.expensesSum) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
