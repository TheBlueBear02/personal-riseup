"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import { EraSelect } from "@/components/EraSelect";
import { TimeframeSelect } from "@/components/TimeframeSelect";
import { ERAS } from "@/eras.config";
import type { MonthPoint } from "@/lib/types";
import { formatIls, formatMonthLabel } from "@/lib/format";
import {
  DEFAULT_ERA,
  eraOptions,
  filterByEra,
  type EraFilter,
} from "@/lib/eraFilter";
import {
  DEFAULT_TIMEFRAME,
  filterByTimeframe,
  resolveTimeframe,
  timeframeOptions,
  type Timeframe,
} from "@/lib/timeframe";

type ExpenseTypeOption = { id: string; label: string };

/** Types from the selected era; when "all", current-era types first then extras. */
function expenseTypeOptions(era: EraFilter): ExpenseTypeOption[] {
  if (era !== "all") {
    const match = ERAS.find((e) => e.id === era);
    return (
      match?.incomeExpenses.expenseLineItems.map((item) => ({
        id: item.id,
        label: item.label,
      })) ?? []
    );
  }

  const labels = new Map<string, string>();
  for (const e of ERAS) {
    for (const item of e.incomeExpenses.expenseLineItems) {
      labels.set(item.id, item.label);
    }
  }
  const current =
    ERAS.find((e) => e.id === "current")?.incomeExpenses.expenseLineItems ?? [];

  const ordered: ExpenseTypeOption[] = current.map((item) => ({
    id: item.id,
    label: labels.get(item.id) ?? item.label,
  }));
  const seen = new Set(ordered.map((o) => o.id));
  for (const [id, label] of labels) {
    if (!seen.has(id)) ordered.push({ id, label });
  }
  return ordered;
}

function TypeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ExpenseTypeOption[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="relative inline-flex min-w-0 max-w-[11rem] shrink items-center sm:max-w-[14rem]">
      <span className="sr-only">סוג הוצאה</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none truncate rounded-full border border-black/10 bg-page py-1.5 pe-7 ps-3 text-xs font-medium text-text-primary outline-none transition hover:border-indigo/40 focus:border-indigo"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
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

type Props = {
  data: MonthPoint[];
};

export function ExpenseTypeHistoryChart({ data }: Props) {
  const [era, setEra] = useState<EraFilter>(DEFAULT_ERA);
  const [typeId, setTypeId] = useState(
    () => expenseTypeOptions(DEFAULT_ERA)[0]?.id ?? "",
  );
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);

  const eraOpts = eraOptions();
  const typeOptions = expenseTypeOptions(era);
  const effectiveTypeId = typeOptions.some((o) => o.id === typeId)
    ? typeId
    : (typeOptions[0]?.id ?? "");

  const scoped = filterByEra(data, era);
  const tfOptions = timeframeOptions(scoped);
  const effectiveTimeframe = resolveTimeframe(timeframe, tfOptions);

  const selectedLabel =
    typeOptions.find((o) => o.id === effectiveTypeId)?.label ?? effectiveTypeId;

  const chartData = filterByTimeframe(scoped, effectiveTimeframe)
    .filter((p) => p.expenseBreakdown.some((e) => e.id === effectiveTypeId))
    .map((p) => ({
      yearMonth: p.yearMonth,
      label: formatMonthLabel(p.yearMonth),
      value: p.expenseBreakdown.find((e) => e.id === effectiveTypeId)?.value ?? 0,
    }));

  const periodSum = chartData.reduce((sum, row) => sum + row.value, 0);
  const activeMonths = chartData.filter((row) => row.value !== 0);
  const monthsNonZero = activeMonths.length;
  const firstActive = activeMonths[0] ?? null;
  const lastActive = activeMonths[activeMonths.length - 1] ?? null;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">
            היסטוריית סוג הוצאה
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            סכום חודשי לפי קטגוריה
          </p>
          {chartData.length > 0 && (
            <>
              <p className="mt-2 text-2xl font-bold tracking-tight text-coral">
                {formatIls(periodSum)}
              </p>
              {monthsNonZero > 0 && firstActive && lastActive ? (
                <p className="mt-1 text-sm text-text-secondary">
                  {monthsNonZero === 1
                    ? `חודש אחד עם הוצאה · ${firstActive.label}`
                    : `${monthsNonZero} חודשים עם הוצאה · ${firstActive.label} – ${lastActive.label}`}
                </p>
              ) : (
                <p className="mt-1 text-sm text-text-secondary">אין חודשים עם הוצאה בטווח</p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EraSelect value={era} options={eraOpts} onChange={setEra} />
          {typeOptions.length > 0 && (
            <TypeSelect
              value={effectiveTypeId}
              options={typeOptions}
              onChange={setTypeId}
            />
          )}
          <TimeframeSelect
            value={effectiveTimeframe}
            options={tfOptions}
            onChange={setTimeframe}
          />
        </div>
      </div>

      {typeOptions.length === 0 || chartData.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          אין נתונים להצגה עבור {selectedLabel || "סוג זה"}
        </p>
      ) : (
        <ChartErrorBoundary label="expense-type-history">
          <ChartContainer height={288}>
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={chartData}
                margin={{ top: 24, right: 4, left: 4, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#8E8E93" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  angle={-35}
                  textAnchor="end"
                  height={56}
                />
                <YAxis hide domain={[0, "dataMax + 500"]} />
                <ReferenceLine y={0} stroke="#C7C7CC" strokeWidth={1} />
                <Tooltip
                  formatter={(value) => [formatIls(Number(value)), selectedLabel]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    direction: "rtl",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#EE7E6E"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value) => {
                      const n = Number(value);
                      if (!Number.isFinite(n) || n === 0) return "";
                      return new Intl.NumberFormat("he-IL", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(n);
                    }}
                    style={{ fontSize: 10, fill: "#8E8E93" }}
                  />
                </Bar>
              </BarChart>
            )}
          </ChartContainer>
        </ChartErrorBoundary>
      )}
    </section>
  );
}
