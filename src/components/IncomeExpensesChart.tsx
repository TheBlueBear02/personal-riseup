"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import { TimeframeSelect } from "@/components/TimeframeSelect";
import type { MonthPoint } from "@/lib/types";
import { formatIls, formatMonthLabel } from "@/lib/format";
import { filterByEra, type EraFilter } from "@/lib/eraFilter";
import {
  DEFAULT_MA_WINDOW,
  movingAverage,
} from "@/lib/movingAverage";
import {
  DEFAULT_TIMEFRAME,
  filterByTimeframe,
  resolveTimeframe,
  timeframeOptions,
  type Timeframe,
} from "@/lib/timeframe";

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

const SERIES_LABELS: Record<string, string> = {
  income: "הכנסות",
  expenses: "הוצאות",
};

function MaToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-indigo/40 bg-indigo/10 text-indigo"
          : "border-black/10 bg-page text-text-secondary hover:border-indigo/40 hover:text-text-primary"
      }`}
    >
      ממוצע נע
    </button>
  );
}

export function IncomeExpensesChart({ data, era }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [showMa, setShowMa] = useState(false);
  const scoped = filterByEra(data, era);
  const options = timeframeOptions(scoped);
  const effectiveTimeframe = resolveTimeframe(timeframe, options);

  const chartData = useMemo(() => {
    const windowPoints = filterByTimeframe(scoped, effectiveTimeframe);

    if (!showMa) {
      return windowPoints.map((p) => ({
        yearMonth: p.yearMonth,
        label: formatMonthLabel(p.yearMonth),
        income: p.income,
        expenses: p.expenses,
      }));
    }

    // MA over full era scope so timeframe months still get trailing history.
    const incomeMa = movingAverage(scoped.map((p) => p.income));
    const expenseMa = movingAverage(scoped.map((p) => p.expenses));
    const maByYm = new Map(
      scoped.map((p, i) => [
        p.yearMonth,
        { income: incomeMa[i] ?? null, expenses: expenseMa[i] ?? null },
      ]),
    );

    return windowPoints
      .map((p) => {
        const ma = maByYm.get(p.yearMonth);
        return {
          yearMonth: p.yearMonth,
          label: formatMonthLabel(p.yearMonth),
          income: ma?.income ?? null,
          expenses: ma?.expenses ?? null,
        };
      })
      .filter((row) => row.income != null || row.expenses != null);
  }, [scoped, effectiveTimeframe, showMa]);

  const subtitle = showMa
    ? `ירוק = הכנסות · אדום = הוצאות · ממוצע נע ${DEFAULT_MA_WINDOW} חודשים`
    : "ירוק = הכנסות · אדום = הוצאות";

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">
            הכנסות מול הוצאות
          </h3>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <MaToggle active={showMa} onChange={setShowMa} />
          <TimeframeSelect
            value={effectiveTimeframe}
            options={options}
            onChange={setTimeframe}
          />
        </div>
      </div>
      <ChartErrorBoundary label="income-expenses">
        <ChartContainer height={256}>
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#8E8E93" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatIls(Number(value)),
                  SERIES_LABELS[String(name)] ?? String(name),
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  direction: "rtl",
                }}
              />
              <Legend
                formatter={(value) => SERIES_LABELS[value] ?? value}
                wrapperStyle={{ direction: "rtl", paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#2FBE6E"
                strokeWidth={2.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EE7E6E"
                strokeWidth={2.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ChartContainer>
      </ChartErrorBoundary>
    </section>
  );
}
