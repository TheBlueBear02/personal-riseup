"use client";

import dynamic from "next/dynamic";
import type { MonthPoint } from "@/lib/types";
import type { EraFilter } from "@/lib/eraFilter";

const ChartsSection = dynamic(() => import("@/components/ChartsSection"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-[20px] bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        />
      ))}
    </div>
  ),
});

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

/** Client boundary so `dynamic(..., { ssr: false })` is legal in Next.js 16. */
export function ClientCharts({ data, era }: Props) {
  return <ChartsSection data={data} era={era} />;
}
