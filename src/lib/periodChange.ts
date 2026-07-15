import type { MonthPoint } from "@/lib/types";

export type PeriodChange = {
  monthsRequested: number | "all";
  monthsUsed: number;
  /** Latest net worth − net worth at start of window */
  netWorthChange: number | null;
  netWorthChangePct: number | null;
  /** Sum of monthly cashflow in the window */
  cashflowSum: number | null;
  incomeSum: number | null;
  expensesSum: number | null;
  startLabel: string | null;
  endLabel: string | null;
};

export type PeriodOption = {
  value: number | "all";
  label: string;
};

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 3, label: "3 חודשים" },
  { value: 6, label: "6 חודשים" },
  { value: 12, label: "12 חודשים" },
  { value: "all", label: "הכל" },
];

export const DEFAULT_PERIOD: number | "all" = 6;

function sumNullable(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0);
}

/**
 * Made/lost over the last N months (or full history).
 * Window is the trailing `months` points; net-worth change compares
 * the first and last points in that window.
 */
export function computePeriodChange(
  timeline: MonthPoint[],
  months: number | "all",
): PeriodChange {
  if (timeline.length === 0) {
    return {
      monthsRequested: months,
      monthsUsed: 0,
      netWorthChange: null,
      netWorthChangePct: null,
      cashflowSum: null,
      incomeSum: null,
      expensesSum: null,
      startLabel: null,
      endLabel: null,
    };
  }

  const window =
    months === "all"
      ? timeline
      : timeline.slice(-Math.max(1, Math.floor(months)));

  const start = window[0];
  const end = window[window.length - 1];

  let netWorthChange: number | null = null;
  let netWorthChangePct: number | null = null;
  if (start.netWorth != null && end.netWorth != null) {
    netWorthChange = end.netWorth - start.netWorth;
    if (start.netWorth !== 0) {
      netWorthChangePct = netWorthChange / start.netWorth;
    }
  }

  return {
    monthsRequested: months,
    monthsUsed: window.length,
    netWorthChange,
    netWorthChangePct,
    cashflowSum: sumNullable(window.map((p) => p.cashflow)),
    incomeSum: sumNullable(window.map((p) => p.income)),
    expensesSum: sumNullable(window.map((p) => p.expenses)),
    startLabel: start.date,
    endLabel: end.date,
  };
}
