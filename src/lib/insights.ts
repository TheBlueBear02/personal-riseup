import type { MonthPoint } from "@/lib/types";

export type Insights = {
  currentNetWorth: number | null;
  netWorthMomChange: number | null;
  netWorthMomChangePct: number | null;
  latestCashflow: number | null;
  avgCashflow12: number | null;
  savingsRateLatest: number | null;
  avgSavingsRate12: number | null;
  bestCashflowMonth: { date: string; value: number } | null;
  worstCashflowMonth: { date: string; value: number } | null;
  totalSaved: number | null;
  monthsTracked: number;
  latest: MonthPoint | null;
  previous: MonthPoint | null;
  /** Index into timeline for `latest` (selected month). */
  selectedIndex: number;
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Insights for a point in the timeline.
 * @param atIndex — month to treat as "current" (default: last).
 */
export function computeInsights(
  timeline: MonthPoint[],
  atIndex?: number,
): Insights {
  const monthsTracked = timeline.length;
  const selectedIndex =
    monthsTracked === 0
      ? -1
      : Math.min(
          Math.max(atIndex ?? monthsTracked - 1, 0),
          monthsTracked - 1,
        );
  const latest = selectedIndex >= 0 ? timeline[selectedIndex] : null;
  const previous = selectedIndex > 0 ? timeline[selectedIndex - 1] : null;
  const first = monthsTracked > 0 ? timeline[0] : null;

  const windowStart = Math.max(0, selectedIndex - 11);
  const last12 =
    selectedIndex >= 0 ? timeline.slice(windowStart, selectedIndex + 1) : [];

  const cashflows12 = last12
    .map((p) => p.cashflow)
    .filter((v): v is number => v != null);

  const savingsRates12 = last12
    .map((p) => {
      if (p.cashflow == null || p.income == null || p.income === 0) return null;
      return p.cashflow / p.income;
    })
    .filter((v): v is number => v != null);

  let netWorthMomChange: number | null = null;
  let netWorthMomChangePct: number | null = null;
  if (latest?.netWorth != null && previous?.netWorth != null) {
    netWorthMomChange = latest.netWorth - previous.netWorth;
    if (previous.netWorth !== 0) {
      netWorthMomChangePct = netWorthMomChange / previous.netWorth;
    }
  }

  let savingsRateLatest: number | null = null;
  if (
    latest?.cashflow != null &&
    latest.income != null &&
    latest.income !== 0
  ) {
    savingsRateLatest = latest.cashflow / latest.income;
  }

  let bestCashflowMonth: Insights["bestCashflowMonth"] = null;
  let worstCashflowMonth: Insights["worstCashflowMonth"] = null;
  for (const point of timeline) {
    if (point.cashflow == null) continue;
    if (!bestCashflowMonth || point.cashflow > bestCashflowMonth.value) {
      bestCashflowMonth = { date: point.date, value: point.cashflow };
    }
    if (!worstCashflowMonth || point.cashflow < worstCashflowMonth.value) {
      worstCashflowMonth = { date: point.date, value: point.cashflow };
    }
  }

  let totalSaved: number | null = null;
  if (latest?.netWorth != null && first?.netWorth != null) {
    totalSaved = latest.netWorth - first.netWorth;
  }

  return {
    currentNetWorth: latest?.netWorth ?? null,
    netWorthMomChange,
    netWorthMomChangePct,
    latestCashflow: latest?.cashflow ?? null,
    avgCashflow12: mean(cashflows12),
    savingsRateLatest,
    avgSavingsRate12: mean(savingsRates12),
    bestCashflowMonth,
    worstCashflowMonth,
    totalSaved,
    monthsTracked,
    latest,
    previous,
    selectedIndex,
  };
}
