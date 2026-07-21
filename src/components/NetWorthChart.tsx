"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";
import { useState } from "react";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import { TimeframeSelect } from "@/components/TimeframeSelect";
import type { MonthPoint } from "@/lib/types";
import { formatIls, formatMonthLabel } from "@/lib/format";
import { filterByEra, type EraFilter } from "@/lib/eraFilter";
import {
  ALL_TIMEFRAME,
  filterByTimeframe,
  resolveTimeframe,
  timeframeOptions,
  type Timeframe,
} from "@/lib/timeframe";

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

export function NetWorthChart({ data, era }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(ALL_TIMEFRAME);
  const scoped = filterByEra(data, era);
  const options = timeframeOptions(scoped);
  const effectiveTimeframe = resolveTimeframe(timeframe, options, ALL_TIMEFRAME);
  const chartData = filterByTimeframe(scoped, effectiveTimeframe)
    .filter((p) => p.netWorth != null)
    .map((p) => ({
      yearMonth: p.yearMonth,
      label: formatMonthLabel(p.yearMonth),
      netWorth: p.netWorth,
      eraId: p.eraId,
    }));

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">שווי נקי לאורך זמן</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {era === "all"
              ? "כל התקופות מחוברות לטיימליין אחד"
              : "מסונן לפי תקופת החיים שנבחרה"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TimeframeSelect
            value={effectiveTimeframe}
            options={options}
            onChange={setTimeframe}
          />
        </div>
      </div>
      <ChartErrorBoundary label="net-worth">
        <ChartContainer height={256}>
          {({ width, height }) => (
            <AreaChart
              width={width}
              height={height}
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2FBE6E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2FBE6E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                formatter={(value) => [formatIls(Number(value)), "שווי נקי"]}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as { label?: string })?.label ?? ""
                }
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  direction: "rtl",
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#2FBE6E"
                strokeWidth={2.5}
                fill="url(#nwFill)"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </ChartErrorBoundary>
    </section>
  );
}
