"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
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

export function CashflowChart({ data }: Props) {
  // Show last 12 months for the Riseup-style month-comparison chart
  const chartData = data.slice(-12).map((p) => ({
    yearMonth: p.yearMonth,
    label: formatMonthLabel(p.yearMonth),
    cashflow: p.cashflow ?? 0,
  }));

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <h3 className="text-base font-semibold text-text-primary">
        החודש ביחס לחודשים אחרים
      </h3>
      <p className="mt-1 text-sm text-text-secondary">תזרים חודשי · 12 חודשים אחרונים</p>
      <div className="mt-4 h-72 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 4, left: 4, bottom: 0 }}>
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
            <Bar dataKey="cashflow" radius={[6, 6, 0, 0]} maxBarSize={36}>
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
        </ResponsiveContainer>
      </div>
    </section>
  );
}
