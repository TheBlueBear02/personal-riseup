"use client";

import { useState } from "react";
import { DashboardTop } from "@/components/DashboardTop";
import { EraNavigator } from "@/components/EraNavigator";
import { PeriodChangeCard } from "@/components/PeriodChangeCard";
import { ClientCharts } from "@/components/ClientCharts";
import { InsightCards } from "@/components/InsightCards";
import type { Insights } from "@/lib/insights";
import type { MonthPoint } from "@/lib/types";
import { DEFAULT_ERA, type EraFilter } from "@/lib/eraFilter";
import { computeStreaks } from "@/lib/tierOne";

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

  return (
    <>
      <DashboardTop data={data} />
      <EraNavigator value={era} onChange={setEra} />
      <PeriodChangeCard data={data} era={era} />
      <ClientCharts data={data} era={era} />
      <InsightCards insights={insights} streaks={streaks} />
    </>
  );
}
