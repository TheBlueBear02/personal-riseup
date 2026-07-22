"use client";

import { useMemo, useState } from "react";
import { DashboardTop } from "@/components/DashboardTop";
import { EraNavigator } from "@/components/EraNavigator";
import { EraComparisonCard } from "@/components/EraComparisonCard";
import { YearSummaryCard } from "@/components/YearSummaryCard";
import { GoalsCard } from "@/components/GoalsCard";
import { FireCard } from "@/components/FireCard";
import { PeriodChangeCard } from "@/components/PeriodChangeCard";
import { ClientCharts } from "@/components/ClientCharts";
import { InsightCards } from "@/components/InsightCards";
import type { Insights } from "@/lib/insights";
import type { MonthPoint } from "@/lib/types";
import { DEFAULT_ERA, type EraFilter } from "@/lib/eraFilter";
import { computeStreaks } from "@/lib/tierOne";
import { computeEraComparison } from "@/lib/tierTwo";
import { computeFireSnapshot, computeGoalProgress } from "@/lib/wealth";

type Props = {
  data: MonthPoint[];
  insights: Insights;
};

/** Owns global era filter for period card + charts; month nav stays in DashboardTop. */
export function DashboardClient({ data, insights }: Props) {
  const [era, setEra] = useState<EraFilter>(DEFAULT_ERA);
  const streaks = computeStreaks(
    data,
    data.length > 0 ? data.length - 1 : 0,
  );
  const eraStats = useMemo(() => computeEraComparison(data), [data]);
  const goals = useMemo(() => computeGoalProgress(data), [data]);
  const fire = useMemo(() => computeFireSnapshot(data), [data]);

  return (
    <>
      <DashboardTop data={data} />
      <EraNavigator value={era} onChange={setEra} />
      <PeriodChangeCard data={data} era={era} />
      <ClientCharts data={data} era={era} />
      <GoalsCard goals={goals} data={data} />
      <FireCard fire={fire} />
      <YearSummaryCard data={data} />
      <EraComparisonCard eras={eraStats} />
      <InsightCards insights={insights} streaks={streaks} />
    </>
  );
}
