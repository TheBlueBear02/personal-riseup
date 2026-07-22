"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import { formatIls } from "@/lib/format";
import type { GoalHistoryPoint } from "@/lib/wealth";

type Props = {
  goalId: string;
  series: GoalHistoryPoint[];
  target: number | null;
  metricLabel: string;
};

/** Compact history line + red target ReferenceLine for an expanded goal. */
export function GoalHistoryChart({
  goalId,
  series,
  target,
  metricLabel,
}: Props) {
  if (series.length === 0) {
    return (
      <p className="mt-3 text-sm text-text-secondary">
        אין היסטוריה להצגה ליעד זה
      </p>
    );
  }

  const values = series.map((p) => p.value);
  const dataMax = Math.max(...values, target ?? 0);
  const dataMin = Math.min(...values, 0);
  const yMax = dataMax <= 0 ? 1 : dataMax * 1.08;

  return (
    <ChartErrorBoundary label={`goal-history-${goalId}`}>
      <ChartContainer height={200} className="mt-3">
        {({ width, height }) => (
          <LineChart
            width={width}
            height={height}
            data={series}
            margin={{ top: 12, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#eee"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#8E8E93" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={36}
            />
            <YAxis hide domain={[dataMin < 0 ? dataMin : 0, yMax]} />
            <Tooltip
              formatter={(value) => [formatIls(Number(value)), metricLabel]}
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as GoalHistoryPoint | undefined)
                  ?.label ?? ""
              }
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                direction: "rtl",
              }}
            />
            {target != null && target > 0 && (
              <ReferenceLine
                y={target}
                stroke="#EE7E6E"
                strokeWidth={1.75}
                strokeDasharray="5 4"
                ifOverflow="extendDomain"
                label={{
                  value: formatIls(target),
                  position: "insideTopLeft",
                  fill: "#EE7E6E",
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#5B60E6"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ChartContainer>
    </ChartErrorBoundary>
  );
}
