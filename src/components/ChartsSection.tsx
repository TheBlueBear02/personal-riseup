"use client";

import { NetWorthChart } from "@/components/NetWorthChart";
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ExpenseTypeHistoryChart } from "@/components/ExpenseTypeHistoryChart";
import { CashflowChart } from "@/components/CashflowChart";
import type { MonthPoint } from "@/lib/types";
import type { EraFilter } from "@/lib/eraFilter";

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

/** Client-only history charts — pies live in DashboardTop (month summary). */
export default function ChartsSection({ data, era }: Props) {
  return (
    <>
      <NetWorthChart data={data} era={era} />
      <IncomeExpensesChart data={data} era={era} />
      <ExpenseTypeHistoryChart data={data} era={era} />
      <CashflowChart data={data} era={era} />
    </>
  );
}
