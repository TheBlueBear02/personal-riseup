import "server-only";

import { ERAS, type Era, isConfigComplete } from "@/eras.config";
import { colToIndex } from "@/lib/columns";
import { parseSheetDate } from "@/lib/dates";
import {
  fetchAllTabs,
  isSheetsConfigured,
  type SheetValuesByTab,
} from "@/lib/sheets";
import type { BreakdownItem, MonthPoint } from "@/lib/types";

export type { MonthPoint } from "@/lib/types";

function cellNumber(row: unknown[], index: number): number {
  if (index < 0 || index >= row.length) return 0;
  const value = row[index];
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cellRaw(row: unknown[], index: number): unknown {
  if (index < 0 || index >= row.length) return null;
  return row[index];
}

type AssetsRow = {
  yearMonth: string;
  date: string;
  netWorth: number;
  assets: BreakdownItem[];
};
type IncomeRow = {
  yearMonth: string;
  date: string;
  income: number;
  expenses: number;
  cashflow: number | null;
  expenseBreakdown: BreakdownItem[];
};

function parseAssetsTab(
  rows: unknown[][],
  era: Era,
): Map<string, AssetsRow> {
  const dateIdx = colToIndex(era.assets.dateCol);
  const totalIdx = colToIndex(era.assets.totalCol);
  const lineItems = era.assets.lineItems.map((item) => ({
    ...item,
    index: colToIndex(item.col),
  }));
  const map = new Map<string, AssetsRow>();

  for (const row of rows) {
    const parsed = parseSheetDate(cellRaw(row, dateIdx));
    if (!parsed) continue;
    map.set(parsed.yearMonth, {
      yearMonth: parsed.yearMonth,
      date: parsed.date,
      netWorth: cellNumber(row, totalIdx),
      assets: lineItems.map((item) => ({
        id: item.id,
        label: item.label,
        value: cellNumber(row, item.index),
      })),
    });
  }
  return map;
}

function parseIncomeExpensesTab(
  rows: unknown[][],
  era: Era,
): Map<string, IncomeRow> {
  const dateIdx = colToIndex(era.incomeExpenses.dateCol);
  const incomeIdx = colToIndex(era.incomeExpenses.incomeTotalCol);
  const expensesIdx = colToIndex(era.incomeExpenses.expensesTotalCol);
  const cashflowIdx = colToIndex(era.incomeExpenses.cashflowTotalCol);
  const expenseItems = era.incomeExpenses.expenseLineItems.map((item) => ({
    ...item,
    index: colToIndex(item.col),
  }));
  const map = new Map<string, IncomeRow>();

  for (const row of rows) {
    const parsed = parseSheetDate(cellRaw(row, dateIdx));
    if (!parsed) continue;

    const income = cellNumber(row, incomeIdx);
    const expenses = cellNumber(row, expensesIdx);

    // Prefer sheet תזרים when the cell is present; empty → fallback later
    let cashflow: number | null = null;
    if (cashflowIdx < row.length) {
      const raw = row[cashflowIdx];
      if (raw != null && raw !== "") {
        cashflow = cellNumber(row, cashflowIdx);
      }
    }

    map.set(parsed.yearMonth, {
      yearMonth: parsed.yearMonth,
      date: parsed.date,
      income,
      expenses,
      cashflow,
      expenseBreakdown: expenseItems.map((item) => ({
        id: item.id,
        label: item.label,
        value: cellNumber(row, item.index),
      })),
    });
  }
  return map;
}

function mergeEra(
  assets: Map<string, AssetsRow>,
  income: Map<string, IncomeRow>,
  eraId: string,
): MonthPoint[] {
  const keys = new Set([...assets.keys(), ...income.keys()]);
  const points: MonthPoint[] = [];

  for (const yearMonth of keys) {
    const a = assets.get(yearMonth);
    const i = income.get(yearMonth);

    const incomeVal = i?.income ?? null;
    const expensesVal = i?.expenses ?? null;
    let cashflow: number | null = i?.cashflow ?? null;
    if (cashflow == null && incomeVal != null && expensesVal != null) {
      cashflow = incomeVal - expensesVal;
    }

    points.push({
      yearMonth,
      date: i?.date ?? a?.date ?? yearMonth,
      netWorth: a?.netWorth ?? null,
      income: incomeVal,
      expenses: expensesVal,
      cashflow,
      eraId,
      assets: a?.assets ?? [],
      expenseBreakdown: i?.expenseBreakdown ?? [],
    });
  }

  return points;
}

export function normalizeAllTabs(tabs: SheetValuesByTab): MonthPoint[] {
  const byYearMonth = new Map<string, MonthPoint>();

  // Later eras in ERAS overwrite earlier ones on yearMonth collision
  for (const era of ERAS) {
    const assetsRows = tabs[era.assets.tab] ?? [];
    const incomeRows = tabs[era.incomeExpenses.tab] ?? [];

    const assets = parseAssetsTab(assetsRows, era);
    const income = parseIncomeExpensesTab(incomeRows, era);
    const points = mergeEra(assets, income, era.id);

    for (const point of points) {
      byYearMonth.set(point.yearMonth, point);
    }
  }

  return [...byYearMonth.values()].sort((a, b) =>
    a.yearMonth.localeCompare(b.yearMonth),
  );
}

export type TimelineResult =
  | { ok: true; data: MonthPoint[] }
  | { ok: false; reason: "not_configured" | "config_incomplete" | "fetch_error"; message: string };

export async function getTimeline(): Promise<TimelineResult> {
  if (!isSheetsConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "חסרים משתני סביבה. מלאו את GOOGLE_SPREADSHEET_ID ו-GOOGLE_SERVICE_ACCOUNT_KEY בקובץ .env.local",
    };
  }

  if (!isConfigComplete()) {
    return {
      ok: false,
      reason: "config_incomplete",
      message:
        'עדיין לא מולאו אותיות העמודות ב-eras.config.ts (ערכי "TODO"). ראו סעיף 11F במסמך ה-MVP.',
    };
  }

  try {
    const tabs = await fetchAllTabs();
    const data = normalizeAllTabs(tabs);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "fetch_error", message };
  }
}
