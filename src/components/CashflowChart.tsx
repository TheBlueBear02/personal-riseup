"use client";

import {
  Bar,
  BarChart,
  Cell,
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

type Props = {
  data: MonthPoint[];
};

export function CashflowChart({ data }: Props) {
  const [era, setEra] = useState<EraFilter>(DEFAULT_ERA);
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const eraOpts = eraOptions();
  const scoped = filterByEra(data, era);
  const options = timeframeOptions(scoped);
  const effectiveTimeframe = resolveTimeframe(timeframe, options);
  const chartData = filterByTimeframe(scoped, effectiveTimeframe).map((p) => ({
    yearMonth: p.yearMonth,
    label: formatMonthLabel(p.yearMonth),
    cashflow: p.cashflow ?? 0,
  }));

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">
            החודש ביחס לחודשים אחרים
          </h3>
          <p className="mt-1 text-sm text-text-secondary">תזרים חודשי</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EraSelect value={era} options={eraOpts} onChange={setEra} />
          <TimeframeSelect
            value={effectiveTimeframe}
            options={options}
            onChange={setTimeframe}
          />
        </div>
      </div>
      <ChartErrorBoundary label="cashflow">
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
                interval={0}
                angle={-35}
                textAnchor="end"
                height={56}
              />
              <YAxis hide domain={["dataMin - 1000", "dataMax + 1000"]} />
              <ReferenceLine y={0} stroke="#C7C7CC" strokeWidth={1} />
              <Tooltip
                formatter={(value) => [formatIls(Number(value)), "תזרים"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  direction: "rtl",
                }}
              />
              <Bar
                dataKey="cashflow"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.yearMonth}
                    fill={entry.cashflow >= 0 ? "#2FBE6E" : "#EE7E6E"}
                  />
                ))}
                <LabelList
                  dataKey="cashflow"
                  position="top"
                  formatter={(value) => {
                    const n = Number(value);
                    if (!Number.isFinite(n)) return "";
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
    </section>
  );
}
