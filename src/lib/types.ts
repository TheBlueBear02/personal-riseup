/** Named amount used for asset / expense allocation slices. */
export type BreakdownItem = {
  id: string;
  label: string;
  value: number;
};

/** @deprecated Prefer BreakdownItem — kept as an alias for existing imports. */
export type AssetSlice = BreakdownItem;

export type MonthPoint = {
  yearMonth: string;
  date: string;
  netWorth: number | null;
  income: number | null;
  expenses: number | null;
  cashflow: number | null;
  eraId: string;
  /** Per-type asset amounts for this month (from the era's lineItems). */
  assets: BreakdownItem[];
  /** Per-type expense amounts for this month (from expenseLineItems). */
  expenseBreakdown: BreakdownItem[];
};
