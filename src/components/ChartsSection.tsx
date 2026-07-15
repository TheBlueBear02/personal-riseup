"use client";

import { NetWorthChart } from "@/components/NetWorthChart";
import { AssetAllocationChart } from "@/components/AssetAllocationChart";
import { IncomeExpensesChart } from "@/components/IncomeExpensesChart";
import { ExpenseBreakdownChart } from "@/components/ExpenseBreakdownChart";
import { ExpenseTypeHistoryChart } from "@/components/ExpenseTypeHistoryChart";
import { CashflowChart } from "@/components/CashflowChart";
import type { MonthPoint } from "@/lib/types";

type Props = {
  data: MonthPoint[];
};

/** Client-only charts bundle — loaded with ssr:false from the page. */
export default function ChartsSection({ data }: Props) {
  return (
    <>
      <NetWorthChart data={data} />
      <AssetAllocationChart data={data} />
      <IncomeExpensesChart data={data} />
      <ExpenseBreakdownChart data={data} />
      <ExpenseTypeHistoryChart data={data} />
      <CashflowChart data={data} />
    </>
  );
}
