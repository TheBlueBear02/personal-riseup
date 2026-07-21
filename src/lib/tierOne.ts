import { ERAS, type ExpenseKind } from "@/eras.config";
import type { BreakdownItem, MonthPoint } from "@/lib/types";

const HIGH_SAVINGS_RATE = 0.2;
const ANOMALY_LOOKBACK = 6;
const MOVER_LIMIT = 4;

/** id → kind; later eras override earlier (current listed first in ERAS wins if we reverse). */
export function expenseKindById(): Map<string, ExpenseKind> {
  const map = new Map<string, ExpenseKind>();
  // Army first, then current — so current wins on shared ids like "food".
  for (const era of [...ERAS].reverse()) {
    for (const item of era.incomeExpenses.expenseLineItems) {
      if (item.kind) map.set(item.id, item.kind);
    }
  }
  return map;
}

export type SavingsRatePoint = {
  yearMonth: string;
  rate: number | null;
};

export function savingsRateSeries(
  timeline: MonthPoint[],
  atIndex: number,
  count = 12,
): SavingsRatePoint[] {
  if (timeline.length === 0 || atIndex < 0) return [];
  const start = Math.max(0, atIndex - count + 1);
  return timeline.slice(start, atIndex + 1).map((p) => ({
    yearMonth: p.yearMonth,
    rate:
      p.cashflow != null && p.income != null && p.income !== 0
        ? p.cashflow / p.income
        : null,
  }));
}

export type ExpenseAnomaly = {
  id: string;
  label: string;
  value: number;
  average: number;
  delta: number;
  deltaPct: number | null;
};

/** Categories farthest above their trailing average (spend to watch). */
export function computeExpenseAnomalies(
  timeline: MonthPoint[],
  atIndex: number,
  lookback = ANOMALY_LOOKBACK,
): ExpenseAnomaly[] {
  const current = timeline[atIndex];
  if (!current) return [];

  const histStart = Math.max(0, atIndex - lookback);
  const history = timeline.slice(histStart, atIndex);
  if (history.length === 0) return [];

  const sums = new Map<string, { label: string; total: number; n: number }>();
  for (const month of history) {
    for (const item of month.expenseBreakdown) {
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

  const anomalies: ExpenseAnomaly[] = [];
  for (const item of current.expenseBreakdown) {
    const hist = sums.get(item.id);
    if (!hist || hist.n === 0) continue;
    const average = hist.total / hist.n;
    const delta = item.value - average;
    if (delta <= 0) continue;
    anomalies.push({
      id: item.id,
      label: item.label,
      value: item.value,
      average,
      delta,
      deltaPct: average !== 0 ? delta / average : null,
    });
  }

  return anomalies.sort((a, b) => b.delta - a.delta).slice(0, 3);
}

export type YoYCompare = {
  currentYm: string;
  priorYm: string | null;
  prior: MonthPoint | null;
  cashflowDelta: number | null;
  incomeDelta: number | null;
  expensesDelta: number | null;
  netWorthDelta: number | null;
};

function priorYearMonth(yearMonth: string): string | null {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) return null;
  return `${y - 1}-${String(m).padStart(2, "0")}`;
}

export function computeYoY(
  timeline: MonthPoint[],
  atIndex: number,
): YoYCompare {
  const current = timeline[atIndex];
  const empty: YoYCompare = {
    currentYm: current?.yearMonth ?? "",
    priorYm: null,
    prior: null,
    cashflowDelta: null,
    incomeDelta: null,
    expensesDelta: null,
    netWorthDelta: null,
  };
  if (!current) return empty;

  const priorYm = priorYearMonth(current.yearMonth);
  if (!priorYm) return { ...empty, currentYm: current.yearMonth };

  const prior = timeline.find((p) => p.yearMonth === priorYm) ?? null;
  if (!prior) {
    return { ...empty, currentYm: current.yearMonth, priorYm, prior: null };
  }

  const delta = (
    a: number | null,
    b: number | null,
  ): number | null => (a != null && b != null ? a - b : null);

  return {
    currentYm: current.yearMonth,
    priorYm,
    prior,
    cashflowDelta: delta(current.cashflow, prior.cashflow),
    incomeDelta: delta(current.income, prior.income),
    expensesDelta: delta(current.expenses, prior.expenses),
    netWorthDelta: delta(current.netWorth, prior.netWorth),
  };
}

export type StreakInfo = {
  positiveCashflow: number;
  highSavings: number;
};

/** Streaks ending at `atIndex`, walking backwards. */
export function computeStreaks(
  timeline: MonthPoint[],
  atIndex: number,
): StreakInfo {
  let positiveCashflow = 0;
  let highSavings = 0;

  for (let i = atIndex; i >= 0; i--) {
    const p = timeline[i];
    if (p.cashflow == null || p.cashflow <= 0) break;
    positiveCashflow += 1;
  }

  for (let i = atIndex; i >= 0; i--) {
    const p = timeline[i];
    if (p.cashflow == null || p.income == null || p.income === 0) break;
    const rate = p.cashflow / p.income;
    if (rate < HIGH_SAVINGS_RATE) break;
    highSavings += 1;
  }

  return { positiveCashflow, highSavings };
}

export type Mover = {
  id: string;
  label: string;
  current: number;
  previous: number;
  delta: number;
};

function moversFromBreakdown(
  current: BreakdownItem[],
  previous: BreakdownItem[],
): Mover[] {
  const prevMap = new Map(previous.map((i) => [i.id, i]));
  const ids = new Set([
    ...current.map((i) => i.id),
    ...previous.map((i) => i.id),
  ]);
  const movers: Mover[] = [];
  for (const id of ids) {
    const cur = current.find((i) => i.id === id);
    const prev = prevMap.get(id);
    const currentVal = cur?.value ?? 0;
    const previousVal = prev?.value ?? 0;
    const delta = currentVal - previousVal;
    if (delta === 0) continue;
    movers.push({
      id,
      label: cur?.label ?? prev?.label ?? id,
      current: currentVal,
      previous: previousVal,
      delta,
    });
  }
  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export type TopMovers = {
  expenses: Mover[];
  assets: Mover[];
};

export function computeTopMovers(
  timeline: MonthPoint[],
  atIndex: number,
  limit = MOVER_LIMIT,
): TopMovers {
  const current = timeline[atIndex];
  const previous = atIndex > 0 ? timeline[atIndex - 1] : null;
  if (!current || !previous) return { expenses: [], assets: [] };

  return {
    expenses: moversFromBreakdown(
      current.expenseBreakdown,
      previous.expenseBreakdown,
    ).slice(0, limit),
    assets: moversFromBreakdown(current.assets, previous.assets).slice(
      0,
      limit,
    ),
  };
}

export type NeedsLuxuriesSplit = {
  needs: number;
  luxuries: number;
  unclassified: number;
  needsShare: number | null;
  luxuriesShare: number | null;
  needsItems: BreakdownItem[];
  luxuriesItems: BreakdownItem[];
  unclassifiedItems: BreakdownItem[];
};

export function computeNeedsLuxuries(
  point: MonthPoint | null,
  kindMap: Map<string, ExpenseKind> = expenseKindById(),
): NeedsLuxuriesSplit {
  let needs = 0;
  let luxuries = 0;
  let unclassified = 0;
  const needsItems: BreakdownItem[] = [];
  const luxuriesItems: BreakdownItem[] = [];
  const unclassifiedItems: BreakdownItem[] = [];
  if (!point) {
    return {
      needs: 0,
      luxuries: 0,
      unclassified: 0,
      needsShare: null,
      luxuriesShare: null,
      needsItems,
      luxuriesItems,
      unclassifiedItems,
    };
  }
  for (const item of point.expenseBreakdown) {
    if (item.value === 0) continue;
    const kind = kindMap.get(item.id);
    if (kind === "need") {
      needs += item.value;
      needsItems.push(item);
    } else if (kind === "luxury") {
      luxuries += item.value;
      luxuriesItems.push(item);
    } else {
      unclassified += item.value;
      unclassifiedItems.push(item);
    }
  }
  needsItems.sort((a, b) => b.value - a.value);
  luxuriesItems.sort((a, b) => b.value - a.value);
  unclassifiedItems.sort((a, b) => b.value - a.value);
  const total = needs + luxuries + unclassified;
  return {
    needs,
    luxuries,
    unclassified,
    needsShare: total > 0 ? needs / total : null,
    luxuriesShare: total > 0 ? luxuries / total : null,
    needsItems,
    luxuriesItems,
    unclassifiedItems,
  };
}
