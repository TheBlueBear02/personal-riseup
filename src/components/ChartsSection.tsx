"use client";

import { NetWorthChart } from "@/components/NetWorthChart";
import { AssetAllocationChart } from "@/components/AssetAllocationChart";
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ExpenseBreakdownChart } from "@/components/ExpenseBreakdownChart";
import { ExpenseTypeHistoryChart } from "@/components/ExpenseTypeHistoryChart";
import { CashflowChart } from "@/components/CashflowChart";
import type { MonthPoint } from "@/lib/types";
import type { EraFilter } from "@/lib/eraFilter";

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

/** Client-only charts bundle — loaded with ssr:false from the page. */
export default function ChartsSection({ data, era }: Props) {
  return (
    <>
      <NetWorthChart data={data} era={era} />
      <AssetAllocationChart data={data} />
      <IncomeExpensesChart data={data} era={era} />
      <ExpenseBreakdownChart data={data} />
      <ExpenseTypeHistoryChart data={data} era={era} />
      <CashflowChart data={data} era={era} />
    </>
  );
}
