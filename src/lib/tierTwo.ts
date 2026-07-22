import { ERAS } from "@/eras.config";
import type { BreakdownItem, MonthPoint } from "@/lib/types";
import { yearsInData } from "@/lib/timeframe";

const TOP_EXPENSE_LIMIT = 3;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function eraLabel(eraId: string): string {
  return ERAS.find((e) => e.id === eraId)?.label ?? eraId;
}

/** Share of net worth (0–1), or null when NW missing/zero. */
export function assetShare(
  value: number,
  netWorth: number | null | undefined,
): number | null {
  if (netWorth == null || netWorth === 0) return null;
  return value / netWorth;
}

export type AllocationDriftItem = {
  id: string;
  label: string;
  value: number;
  delta: number | null;
  share: number | null;
  shareDelta: number | null;
};

/** Per-asset MoM ₪ change + allocation % drift vs prior month. */
export function computeAllocationDrift(
  current: MonthPoint | null,
  previous: MonthPoint | null,
): AllocationDriftItem[] {
  if (!current) return [];

  const prevMap = new Map((previous?.assets ?? []).map((a) => [a.id, a]));
  const ids = new Set([
    ...current.assets.map((a) => a.id),
    ...(previous?.assets ?? []).map((a) => a.id),
  ]);

  const items: AllocationDriftItem[] = [];
  for (const id of ids) {
    const cur = current.assets.find((a) => a.id === id);
    const prev = prevMap.get(id);
    const value = cur?.value ?? 0;
    const prevValue = prev?.value ?? 0;
    if (value === 0 && prevValue === 0) continue;

    const share = assetShare(value, current.netWorth);
    const prevShare =
      previous != null ? assetShare(prevValue, previous.netWorth) : null;

    items.push({
      id,
      label: cur?.label ?? prev?.label ?? id,
      value,
      delta: previous == null ? null : value - prevValue,
      share,
      shareDelta:
        share != null && prevShare != null ? share - prevShare : null,
    });
  }

  // Largest absolute ₪ movers first; stable for ties.
  return items.sort((a, b) => {
    const da = Math.abs(a.delta ?? 0);
    const db = Math.abs(b.delta ?? 0);
    if (db !== da) return db - da;
    return b.value - a.value;
  });
}

export type EraStats = {
  eraId: string;
  label: string;
  months: number;
  avgCashflow: number | null;
  avgSavingsRate: number | null;
  avgIncome: number | null;
  avgExpenses: number | null;
  topExpenses: BreakdownItem[];
};

function topExpensesByAverage(
  points: MonthPoint[],
  limit = TOP_EXPENSE_LIMIT,
): BreakdownItem[] {
  const sums = new Map<string, { label: string; total: number; n: number }>();
  for (const point of points) {
    for (const item of point.expenseBreakdown) {
      if (item.value === 0) continue;
      const prev = sums.get(item.id) ?? {
        label: item.label,
        total: 0,
        n: 0,
      };
      prev.total += item.value;
      prev.n += 1;
      prev.label = item.label;
      sums.set(item.id, prev);
    }
  }

  return [...sums.entries()]
    .map(([id, s]) => ({
      id,
      label: s.label,
      value: s.total / s.n,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** One row per era present in the timeline (config order, then extras). */
export function computeEraComparison(timeline: MonthPoint[]): EraStats[] {
  const byEra = new Map<string, MonthPoint[]>();
  for (const point of timeline) {
    const list = byEra.get(point.eraId) ?? [];
    list.push(point);
    byEra.set(point.eraId, list);
  }

  const orderedIds = [
    ...ERAS.map((e) => e.id).filter((id) => byEra.has(id)),
    ...[...byEra.keys()].filter((id) => !ERAS.some((e) => e.id === id)),
  ];

  return orderedIds.map((eraId) => {
    const points = byEra.get(eraId) ?? [];
    const cashflows = points
      .map((p) => p.cashflow)
      .filter((v): v is number => v != null);
    const incomes = points
      .map((p) => p.income)
      .filter((v): v is number => v != null);
    const expenses = points
      .map((p) => p.expenses)
      .filter((v): v is number => v != null);
    const rates = points
      .map((p) => {
        if (p.cashflow == null || p.income == null || p.income === 0) {
          return null;
        }
        return p.cashflow / p.income;
      })
      .filter((v): v is number => v != null);

    return {
      eraId,
      label: eraLabel(eraId),
      months: points.length,
      avgCashflow: mean(cashflows),
      avgSavingsRate: mean(rates),
      avgIncome: mean(incomes),
      avgExpenses: mean(expenses),
      topExpenses: topExpensesByAverage(points),
    };
  });
}

export type YearSummary = {
  year: string;
  isYtd: boolean;
  months: number;
  totalIncome: number | null;
  totalExpenses: number | null;
  totalCashflow: number | null;
  netWorthStart: number | null;
  netWorthEnd: number | null;
  netWorthChange: number | null;
  avgSavingsRate: number | null;
  bestMonth: { yearMonth: string; cashflow: number } | null;
  worstMonth: { yearMonth: string; cashflow: number } | null;
  topExpenses: BreakdownItem[];
};

function sumNullable(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((sum, v) => sum + v, 0);
}

function topExpensesByTotal(
  points: MonthPoint[],
  limit = 5,
): BreakdownItem[] {
  const byId = new Map<string, BreakdownItem>();
  for (const point of points) {
    for (const item of point.expenseBreakdown) {
      if (item.value === 0) continue;
      const existing = byId.get(item.id);
      if (existing) {
        existing.value += item.value;
        existing.label = item.label;
      } else {
        byId.set(item.id, {
          id: item.id,
          label: item.label,
          value: item.value,
        });
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.value - a.value).slice(0, limit);
}

export function yearSummaryOptions(
  timeline: MonthPoint[],
  now = new Date(),
): { value: string; label: string }[] {
  const currentYear = String(now.getFullYear());
  return yearsInData(timeline).map((year) => ({
    value: year,
    label: year === currentYear ? `${year} עד כה` : year,
  }));
}

export function defaultYearSummary(
  options: { value: string }[],
): string {
  return options[0]?.value ?? "";
}

/** Annual report card metrics for one calendar year (YTD if current). */
export function computeYearSummary(
  timeline: MonthPoint[],
  year: string,
  now = new Date(),
): YearSummary | null {
  if (!/^\d{4}$/.test(year)) return null;

  const points = timeline.filter((p) => p.yearMonth.startsWith(`${year}-`));
  if (points.length === 0) return null;

  const isYtd = year === String(now.getFullYear());
  const withNw = points.filter((p) => p.netWorth != null);
  const netWorthStart = withNw[0]?.netWorth ?? null;
  const netWorthEnd = withNw[withNw.length - 1]?.netWorth ?? null;

  let bestMonth: YearSummary["bestMonth"] = null;
  let worstMonth: YearSummary["worstMonth"] = null;
  for (const point of points) {
    if (point.cashflow == null) continue;
    if (!bestMonth || point.cashflow > bestMonth.cashflow) {
      bestMonth = { yearMonth: point.yearMonth, cashflow: point.cashflow };
    }
    if (!worstMonth || point.cashflow < worstMonth.cashflow) {
      worstMonth = { yearMonth: point.yearMonth, cashflow: point.cashflow };
    }
  }

  const rates = points
    .map((p) => {
      if (p.cashflow == null || p.income == null || p.income === 0) return null;
      return p.cashflow / p.income;
    })
    .filter((v): v is number => v != null);

  return {
    year,
    isYtd,
    months: points.length,
    totalIncome: sumNullable(points.map((p) => p.income)),
    totalExpenses: sumNullable(points.map((p) => p.expenses)),
    totalCashflow: sumNullable(points.map((p) => p.cashflow)),
    netWorthStart,
    netWorthEnd,
    netWorthChange:
      netWorthStart != null && netWorthEnd != null
        ? netWorthEnd - netWorthStart
        : null,
    avgSavingsRate: mean(rates),
    bestMonth,
    worstMonth,
    topExpenses: topExpensesByTotal(points),
  };
}
