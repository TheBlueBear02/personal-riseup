"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/normalize";
import { formatIls, formatMonthLabel } from "@/lib/format";

type Props = {
  data: MonthPoint[];
};

export function NetWorthChart({ data }: Props) {
  const chartData = data
    .filter((p) => p.netWorth != null)
    .map((p) => ({
      yearMonth: p.yearMonth,
      label: formatMonthLabel(p.yearMonth),
      netWorth: p.netWorth,
      eraId: p.eraId,
    }));

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <h3 className="text-base font-semibold text-text-primary">שווי נקי לאורך זמן</h3>
      <p className="mt-1 text-sm text-text-secondary">כל התקופות מחוברות לטיימליין אחד</p>
      <div className="mt-4 h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
            <YAxis
              tick={{ fontSize: 11, fill: "#8E8E93" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("he-IL", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)
              }
              width={48}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
