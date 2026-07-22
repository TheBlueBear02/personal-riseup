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

/** Month navigator + heroes + month-summary cards (expenses / assets / YoY). */
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

  const yearMonth = insights.latest?.yearMonth ?? "";

  return (
    <>
      <MonthNavigator
        label={yearMonth}
        canPrev={safeIndex > 0}
        canNext={safeIndex < data.length - 1}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(data.length - 1, i + 1))}
      />
      <HeroSummary insights={insights} />

      {/* Expenses block */}
      <TopMoversCard movers={movers} anomalies={anomalies} />
      <NeedsLuxuriesCard
        split={needsLuxuries}
        data={data}
        yearMonth={yearMonth}
      />

      {/* Assets block */}
      <AssetsMoversCard
        current={insights.latest}
        previous={safeIndex > 0 ? data[safeIndex - 1] : null}
        data={data}
        yearMonth={yearMonth}
      />

      <YoYCompareCard yoy={yoy} current={insights.latest} />
    </>
  );
}
