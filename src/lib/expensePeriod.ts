import type { BreakdownItem, MonthPoint } from "@/lib/types";
import { formatMonthLabel } from "@/lib/format";
import { yearsInData } from "@/lib/timeframe";

export type ExpensePeriodOption = {
  value: string; // `month:YYYY-MM` | `year:YYYY`
  label: string;
};

/** Current-year months (newest first), then year summaries (current = YTD, older = full year). */
export function expensePeriodOptions(
  data: MonthPoint[],
  now = new Date(),
): ExpensePeriodOption[] {
  const currentYear = String(now.getFullYear());
  const relevant = data.filter(
    (p) =>
      p.expenseBreakdown.some((e) => e.value !== 0) ||
      (p.expenses != null && p.expenses !== 0),
  );

  const currentYearMonths = relevant
    .filter((p) => p.yearMonth.startsWith(`${currentYear}-`))
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

  const options: ExpensePeriodOption[] = currentYearMonths.map((p) => ({
    value: `month:${p.yearMonth}`,
    label: formatMonthLabel(p.yearMonth),
  }));

  for (const year of yearsInData(relevant)) {
    options.push({
      value: `year:${year}`,
      label:
        year === currentYear ? `סיכום ${year} עד כה` : `סיכום ${year}`,
    });
  }

  return options;
}

export function defaultExpensePeriod(options: ExpensePeriodOption[]): string {
  return options[0]?.value ?? "";
}

export function pointsForExpensePeriod(
  data: MonthPoint[],
  period: string,
): MonthPoint[] {
  if (period.startsWith("month:")) {
    const yearMonth = period.slice("month:".length);
    return data.filter((p) => p.yearMonth === yearMonth);
  }
  if (period.startsWith("year:")) {
    const year = period.slice("year:".length);
    return data.filter((p) => p.yearMonth.startsWith(`${year}-`));
  }
  return [];
}

/** Sum expense types (and expenses total) across months; later labels win on id clash. */
export function aggregateExpenseBreakdown(points: MonthPoint[]): {
  items: BreakdownItem[];
  total: number | null;
} {
  if (points.length === 0) {
    return { items: [], total: null };
  }

  const byId = new Map<string, BreakdownItem>();
  let expensesSum = 0;
  let hasExpenses = false;

  for (const point of points) {
    if (point.expenses != null) {
      expensesSum += point.expenses;
      hasExpenses = true;
    }
    for (const item of point.expenseBreakdown) {
      const existing = byId.get(item.id);
      if (existing) {
        existing.value += item.value;
        existing.label = item.label;
      } else {
        byId.set(item.id, { id: item.id, label: item.label, value: item.value });
      }
    }
  }

  return {
    items: [...byId.values()],
    total: hasExpenses ? expensesSum : null,
  };
}
