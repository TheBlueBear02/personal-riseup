"use client";

import { useState } from "react";
import { HeroSummary } from "@/components/HeroCards";
import { MonthNavigator } from "@/components/MonthNavigator";
import { YoYCompareCard } from "@/components/YoYCompareCard";
import { NeedsLuxuriesCard } from "@/components/NeedsLuxuriesCard";
import {
  AssetsMoversCard,
  TopMoversCard,
} from "@/components/TopMoversCard";
import { computeInsights } from "@/lib/insights";
import type { MonthPoint } from "@/lib/types";
import {
  computeExpenseAnomalies,
  computeNeedsLuxuries,
  computeTopMovers,
  computeYoY,
} from "@/lib/tierOne";

type Props = {
  data: MonthPoint[];
};

export function DashboardTop({ data }: Props) {
  const [index, setIndex] = useState(() =>
    data.length > 0 ? data.length - 1 : 0,
  );
  const safeIndex =
    data.length === 0 ? 0 : Math.min(Math.max(index, 0), data.length - 1);

  const insights = computeInsights(data, safeIndex);
  const anomalies = computeExpenseAnomalies(data, safeIndex);
  const yoy = computeYoY(data, safeIndex);
  const movers = computeTopMovers(data, safeIndex);
  const needsLuxuries = computeNeedsLuxuries(insights.latest);

  const label =
    insights.latest?.yearMonth != null
      ? insights.latest.yearMonth
      : "";

  return (
    <>
      <MonthNavigator
        label={label}
        canPrev={safeIndex > 0}
        canNext={safeIndex < data.length - 1}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(data.length - 1, i + 1))}
      />
      <HeroSummary insights={insights} />
      <TopMoversCard movers={movers} anomalies={anomalies} />
      <AssetsMoversCard
        current={insights.latest}
        previous={safeIndex > 0 ? data[safeIndex - 1] : null}
      />
      <NeedsLuxuriesCard split={needsLuxuries} />
      <YoYCompareCard yoy={yoy} current={insights.latest} />
    </>
  );
}
