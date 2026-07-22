import { GOALS, type Goal } from "@/goals.config";
import { formatMonthLabel } from "@/lib/format";
import type { MonthPoint } from "@/lib/types";

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sumAssets(
  point: MonthPoint,
  assetIds: string[] | undefined,
): number {
  if (!assetIds || assetIds.length === 0) return 0;
  const wanted = new Set(assetIds);
  let total = 0;
  for (const item of point.assets) {
    if (wanted.has(item.id)) total += item.value;
  }
  return total;
}

/** Sum of expenses over the last `months` points (nulls skipped; empty → null). */
export function sumTrailingExpenses(
  timeline: MonthPoint[],
  months: number,
): number | null {
  if (months <= 0 || timeline.length === 0) return null;
  const window = timeline.slice(-months);
  let total = 0;
  let count = 0;
  for (const point of window) {
    if (point.expenses == null) continue;
    total += point.expenses;
    count += 1;
  }
  return count > 0 ? total : null;
}

export function resolveGoalTarget(
  timeline: MonthPoint[],
  goal: Goal,
): number | null {
  if (goal.expenseMonths != null) {
    return sumTrailingExpenses(timeline, goal.expenseMonths);
  }
  if (goal.target != null && goal.target > 0) return goal.target;
  return null;
}

export type GoalProgress = {
  goal: Goal;
  /** Resolved ₪ target (fixed or dynamic expense sum). */
  target: number | null;
  current: number | null;
  remaining: number | null;
  progress: number | null; // 0–1+, capped display later
  complete: boolean;
};

export function currentTowardGoal(
  point: MonthPoint | null,
  goal: Goal,
): number | null {
  if (!point) return null;
  if (goal.metric === "netWorth") return point.netWorth;
  if (goal.metric === "assets") return sumAssets(point, goal.assetIds);
  return null;
}

export type GoalHistoryPoint = {
  yearMonth: string;
  label: string;
  value: number;
};

/** Full-timeline series for a goal's tracked metric (NW or asset sum). */
export function goalHistorySeries(
  timeline: MonthPoint[],
  goal: Goal,
): GoalHistoryPoint[] {
  const points: GoalHistoryPoint[] = [];
  for (const point of timeline) {
    const value = currentTowardGoal(point, goal);
    if (value == null) continue;
    // Skip months where tracked assets aren't present yet (all zeros before era has them).
    if (goal.metric === "assets" && value === 0) {
      const hasAny = (goal.assetIds ?? []).some((id) =>
        point.assets.some((a) => a.id === id),
      );
      if (!hasAny) continue;
    }
    points.push({
      yearMonth: point.yearMonth,
      label: formatMonthLabel(point.yearMonth),
      value,
    });
  }
  return points;
}

export function computeGoalProgress(
  timeline: MonthPoint[],
  goals: Goal[] = GOALS,
): GoalProgress[] {
  const latest =
    timeline.length > 0 ? timeline[timeline.length - 1]! : null;

  return goals.map((goal) => {
    const current = currentTowardGoal(latest, goal);
    const target = resolveGoalTarget(timeline, goal);
    if (current == null || target == null || target <= 0) {
      return {
        goal,
        target,
        current,
        remaining: null,
        progress: null,
        complete: false,
      };
    }
    const progress = current / target;
    const remaining = Math.max(0, target - current);
    return {
      goal,
      target,
      current,
      remaining,
      progress,
      complete: current >= target,
    };
  });
}

export type FireSnapshot = {
  netWorth: number | null;
  /** Mean monthly expenses over trailing window (null if none). */
  avgMonthlyExpenses: number | null;
  /** avgMonthlyExpenses × 12 */
  annualExpenses: number | null;
  /** NW / annualExpenses — שנות מחייה */
  yearsOfLiving: number | null;
  /** NW × 0.04 — annual 4% withdrawal */
  safeWithdrawal4pct: number | null;
  /** Months used for expense average */
  expenseMonths: number;
};

const FIRE_EXPENSE_LOOKBACK = 12;
const SAFE_WITHDRAWAL_RATE = 0.04;

/** Lightweight FIRE metrics from latest NW + trailing expense average. */
export function computeFireSnapshot(
  timeline: MonthPoint[],
  lookback = FIRE_EXPENSE_LOOKBACK,
): FireSnapshot {
  const latest =
    timeline.length > 0 ? timeline[timeline.length - 1]! : null;
  const netWorth = latest?.netWorth ?? null;

  const start = Math.max(0, timeline.length - lookback);
  const window = timeline.slice(start);
  const expenses = window
    .map((p) => p.expenses)
    .filter((v): v is number => v != null && v > 0);
  const avgMonthlyExpenses = mean(expenses);
  const annualExpenses =
    avgMonthlyExpenses != null ? avgMonthlyExpenses * 12 : null;

  let yearsOfLiving: number | null = null;
  if (netWorth != null && annualExpenses != null && annualExpenses > 0) {
    yearsOfLiving = netWorth / annualExpenses;
  }

  let safeWithdrawal4pct: number | null = null;
  if (netWorth != null && netWorth > 0) {
    safeWithdrawal4pct = netWorth * SAFE_WITHDRAWAL_RATE;
  }

  return {
    netWorth,
    avgMonthlyExpenses,
    annualExpenses,
    yearsOfLiving,
    safeWithdrawal4pct,
    expenseMonths: expenses.length,
  };
}
