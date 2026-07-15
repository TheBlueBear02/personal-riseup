"use client";

import {
  AllocationPieCard,
  buildAllocationSlices,
} from "@/components/AllocationPieCard";
import type { MonthPoint } from "@/lib/types";
import { hebrewMonthName } from "@/lib/format";

type Props = {
  data: MonthPoint[];
};

export function AssetAllocationChart({ data }: Props) {
  const latest = [...data].reverse().find((p) => p.assets.some((a) => a.value !== 0));
  const slices = latest ? buildAllocationSlices(latest.assets, latest.netWorth) : [];
  const monthName = latest ? hebrewMonthName(latest.date) : null;

  return (
    <AllocationPieCard
      title="הרכב שווי נקי"
      subtitle={
        monthName
          ? `פירוט סוגי נכסים · ${monthName}`
          : "פירוט סוגי נכסים לפי הסכום האחרון"
      }
      chartLabel="asset-allocation"
      emptyMessage="אין נתוני פירוט נכסים להצגה"
      totalLabel="סה״כ שווי נקי"
      total={latest?.netWorth ?? null}
      slices={slices}
    />
  );
}
