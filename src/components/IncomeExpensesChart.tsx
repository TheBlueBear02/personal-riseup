"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export function IncomeExpensesChart({ data }: Props) {
  const chartData = data.map((p) => ({
    yearMonth: p.yearMonth,
    label: formatMonthLabel(p.yearMonth),
    income: p.income,
    expenses: p.expenses,
  }));

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <h3 className="text-base font-semibold text-text-primary">הכנסות מול הוצאות</h3>
      <p className="mt-1 text-sm text-text-secondary">ירוק = הכנסות · אדום = הוצאות</p>
      <div className="mt-4 h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
              formatter={(value, name) => [
                formatIls(Number(value)),
                name === "income" ? "הכנסות" : "הוצאות",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                direction: "rtl",
              }}
            />
            <Legend
              formatter={(value) => (value === "income" ? "הכנסות" : "הוצאות")}
              wrapperStyle={{ direction: "rtl", paddingTop: 8 }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2FBE6E"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EE7E6E"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
