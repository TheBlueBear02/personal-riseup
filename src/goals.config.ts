/**
 * Wealth goals — edit targets here (not in the sheet).
 * Progress is computed from the latest MonthPoint in the timeline.
 *
 * metric:
 * - netWorth → latest net worth
 * - assets → sum of listed asset ids (missing ids count as 0)
 *
 * Target: either a fixed `target` ₪ amount, or `expenseMonths`
 * (sum of the last N months' expenses — e.g. emergency fund = 6 חודשי מחייה).
 */
export type GoalMetric = "netWorth" | "assets";

export type Goal = {
  id: string;
  label: string;
  /** Fixed target in ₪. Omit when using expenseMonths. */
  target?: number;
  /**
   * Dynamic target: sum of expenses over the last N months in the timeline.
   * Takes precedence over `target` when set.
   */
  expenseMonths?: number;
  metric: GoalMetric;
  /** Required when metric is "assets" — eras.config asset `id`s */
  assetIds?: string[];
  /** Short hint under the label */
  hint?: string;
};

export const GOALS: Goal[] = [
  {
    id: "new_zero",
    label: "האפס החדש",
    target: 5_000,
    metric: "assets",
    assetIds: ["checking"],
    hint: "עו״ש בלבד",
  },
  {
    id: "emergency",
    label: "קרן חירום",
    expenseMonths: 6,
    metric: "assets",
    assetIds: ["checking", "money_market"],
    hint: "עו״ש + קרן כספית · 6 חודשי מחייה",
  },
  {
    id: "brokerage_100k",
    label: "יעד תיק השקעות",
    target: 100_000,
    metric: "assets",
    assetIds: ["brokerage"],
    hint: "תיק השקעות IB",
  },
  {
    id: "nw_250k",
    label: "אבן דרך · 250 אלף",
    target: 250_000,
    metric: "netWorth",
    hint: "שווי נקי כולל",
  },
];
