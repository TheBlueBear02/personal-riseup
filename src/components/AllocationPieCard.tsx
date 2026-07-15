"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import type { BreakdownItem } from "@/lib/types";
import { formatIls, formatSharePercent } from "@/lib/format";

const SLICE_COLORS = [
  "#2FBE6E",
  "#3D6BCC",
  "#EE7E6E",
  "#E6A817",
  "#5B8A72",
  "#6B7C93",
  "#C45C26",
  "#4A9B8C",
  "#8B6BB5",
  "#D4A017",
  "#5C7A99",
  "#B85C5C",
];

type SliceRow = BreakdownItem & {
  color: string;
  share: number;
};

export function buildAllocationSlices(
  items: BreakdownItem[],
  total: number | null | undefined,
): SliceRow[] {
  const denominator =
    total != null && total > 0
      ? total
      : items.reduce((sum, a) => sum + Math.max(0, a.value), 0);

  return items
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((a, i) => ({
      ...a,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      share: denominator > 0 ? a.value / denominator : 0,
    }));
}

type Props = {
  title: string;
  subtitle: string;
  chartLabel: string;
  emptyMessage: string;
  totalLabel: string;
  total: number | null;
  slices: SliceRow[];
  /** Optional control in the card header (e.g. period select). */
  headerRight?: ReactNode;
};

export function AllocationPieCard({
  title,
  subtitle,
  chartLabel,
  emptyMessage,
  totalLabel,
  total,
  slices,
  headerRight,
}: Props) {
  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        {headerRight}
      </div>

      {slices.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        <ChartErrorBoundary label={chartLabel}>
          <div>
            <ChartContainer height={220}>
              {({ width, height }) => {
                const size = Math.min(width, height);
                return (
                  <PieChart width={width} height={height}>
                    <Pie
                      data={slices}
                      dataKey="value"
                      nameKey="label"
                      cx={width / 2}
                      cy={height / 2}
                      innerRadius={size * 0.28}
                      outerRadius={size * 0.42}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {slices.map((slice) => (
                        <Cell key={slice.id} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const share = (item?.payload as SliceRow | undefined)?.share;
                        return [
                          `${formatIls(Number(value))} · ${formatSharePercent(share)}`,
                          (item?.payload as SliceRow | undefined)?.label ?? "",
                        ];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                        direction: "rtl",
                      }}
                    />
                  </PieChart>
                );
              }}
            </ChartContainer>

            <ul className="mt-2 max-h-64 space-y-2.5 overflow-y-auto">
              {slices.map((slice) => (
                <li
                  key={slice.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 text-text-primary">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden
                    />
                    <span className="truncate">{slice.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-text-secondary">
                    <span className="font-medium text-text-primary">
                      {formatSharePercent(slice.share)}
                    </span>
                    {" · "}
                    {formatIls(slice.value)}
                  </span>
                </li>
              ))}
            </ul>

            {total != null && (
              <p className="mt-4 border-t border-black/5 pt-3 text-sm text-text-secondary">
                {totalLabel}{" "}
                <span className="font-semibold text-text-primary">{formatIls(total)}</span>
              </p>
            )}
          </div>
        </ChartErrorBoundary>
      )}
    </section>
  );
}
