"use client";

import { useMemo, useState } from "react";
import {
  formatIls,
  formatIlsChange,
  formatMonthLabel,
  formatPercent,
  signColorClass,
} from "@/lib/format";
import type { MonthPoint } from "@/lib/types";
import {
  computeYearSummary,
  defaultYearSummary,
  yearSummaryOptions,
} from "@/lib/tierTwo";

type Props = {
  data: MonthPoint[];
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tracking-tight ${
          tone ?? "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Annual report card: income, expenses, saved, best month, top categories. */
export function YearSummaryCard({ data }: Props) {
  const options = useMemo(() => yearSummaryOptions(data), [data]);
  const [year, setYear] = useState(() => defaultYearSummary(options));

  const resolvedYear = options.some((o) => o.value === year)
    ? year
    : defaultYearSummary(options);

  const summary = useMemo(
    () =>
      resolvedYear ? computeYearSummary(data, resolvedYear) : null,
    [data, resolvedYear],
  );

  if (options.length === 0 || !summary) {
    return (
      <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-secondary">סיכום שנתי</p>
        <p className="mt-3 text-sm text-text-secondary">אין מספיק נתונים לשנה.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">סיכום שנתי</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">
            {summary.isYtd
              ? `שנת ${summary.year} עד כה`
              : `שנת ${summary.year}`}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            {summary.months} חודשים מדווחים
          </p>
        </div>
        <label className="relative inline-flex shrink-0 items-center">
          <span className="sr-only">בחירת שנה</span>
          <select
            value={resolvedYear}
            onChange={(e) => setYear(e.target.value)}
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
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Stat
          label="סה״כ הכנסות"
          value={formatIls(summary.totalIncome)}
          tone="text-green"
        />
        <Stat
          label="סה״כ הוצאות"
          value={formatIls(summary.totalExpenses)}
          tone="text-coral"
        />
        <Stat
          label="סה״כ שנחסך (תזרים)"
          value={formatIls(summary.totalCashflow)}
          tone={signColorClass(summary.totalCashflow)}
        />
        <Stat
          label="ממוצע שיעור חיסכון"
          value={formatPercent(summary.avgSavingsRate)}
          tone={signColorClass(summary.avgSavingsRate)}
        />
        <Stat
          label="שינוי שווי נקי"
          value={formatIlsChange(summary.netWorthChange)}
          tone={signColorClass(summary.netWorthChange)}
        />
        <Stat
          label="שווי נקי בסוף"
          value={formatIls(summary.netWorthEnd)}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
        <div>
          <p className="text-xs text-text-secondary">החודש הכי טוב</p>
          <p className="mt-1 text-base font-bold text-green">
            {summary.bestMonth
              ? formatIls(summary.bestMonth.cashflow)
              : "—"}
          </p>
          {summary.bestMonth && (
            <p className="mt-0.5 text-xs text-text-secondary">
              {formatMonthLabel(summary.bestMonth.yearMonth)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-text-secondary">החודש הכי חלש</p>
          <p className="mt-1 text-base font-bold text-coral">
            {summary.worstMonth
              ? formatIls(summary.worstMonth.cashflow)
              : "—"}
          </p>
          {summary.worstMonth && (
            <p className="mt-0.5 text-xs text-text-secondary">
              {formatMonthLabel(summary.worstMonth.yearMonth)}
            </p>
          )}
        </div>
      </div>

      {summary.topExpenses.length > 0 && (
        <div className="mt-5 border-t border-black/5 pt-4">
          <p className="text-xs font-medium text-text-secondary">
            קטגוריות הוצאה מובילות
          </p>
          <ul className="mt-2 space-y-2">
            {summary.topExpenses.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-text-primary">{item.label}</span>
                <span className="shrink-0 font-semibold text-text-primary">
                  {formatIls(item.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
