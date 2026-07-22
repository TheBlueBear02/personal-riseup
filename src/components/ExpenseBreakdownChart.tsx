"use client";

import {
  AllocationPieCard,
  buildAllocationSlices,
} from "@/components/AllocationPieCard";
import type { MonthPoint } from "@/lib/types";
import {
  aggregateExpenseBreakdown,
  pointsForExpensePeriod,
} from "@/lib/expensePeriod";

type Props = {
  data: MonthPoint[];
  /** Month navigator selection — pie locked to this month. */
  yearMonth: string;
  /** Nest inside needs/luxuries (no legend list; no outer card). */
  embedded?: boolean;
};

/** Expense composition for one month (month summary / needs-luxuries). */
export function ExpenseBreakdownChart({
  data,
  yearMonth,
  embedded = false,
}: Props) {
  const points = yearMonth
    ? pointsForExpensePeriod(data, `month:${yearMonth}`)
    : [];
  const { items, total } = aggregateExpenseBreakdown(points);
  const slices = buildAllocationSlices(items, total);

  return (
    <AllocationPieCard
      title="הרכב הוצאות"
      subtitle=""
      chartLabel="expense-breakdown"
      emptyMessage="אין נתוני פירוט הוצאות להצגה"
      totalLabel="סה״כ הוצאות"
      total={total}
      slices={slices}
      embedded={embedded}
      showLegend={!embedded}
      showTotal={!embedded}
    />
  );
}
