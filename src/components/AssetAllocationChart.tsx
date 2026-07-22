"use client";

import {
  AllocationPieCard,
  buildAllocationSlices,
} from "@/components/AllocationPieCard";
import type { MonthPoint } from "@/lib/types";

type Props = {
  data: MonthPoint[];
  /** Month navigator selection — falls back to newest month with assets. */
  yearMonth?: string;
  /** Nest inside assets movers card (no legend; no outer card). */
  embedded?: boolean;
};

export function AssetAllocationChart({
  data,
  yearMonth,
  embedded = false,
}: Props) {
  const selected = yearMonth
    ? (data.find((p) => p.yearMonth === yearMonth) ?? null)
    : null;
  const latest =
    selected ??
    [...data].reverse().find((p) => p.assets.some((a) => a.value !== 0)) ??
    null;

  const slices = latest
    ? buildAllocationSlices(latest.assets, latest.netWorth)
    : [];

  return (
    <AllocationPieCard
      title="הרכב שווי נקי"
      subtitle=""
      chartLabel="asset-allocation"
      emptyMessage="אין נתוני פירוט נכסים להצגה"
      totalLabel="סה״כ שווי נקי"
      total={latest?.netWorth ?? null}
      slices={slices}
      embedded={embedded}
      showLegend={!embedded}
      showTotal={!embedded}
    />
  );
}
