import { ERAS } from "@/eras.config";
import type { BreakdownItem, MonthPoint } from "@/lib/types";

/** Mulberry32 — tiny seeded PRNG for stable-looking demo series. */
function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function roundMoney(n: number): number {
  return Math.round(n);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDisplayDate(year: number, monthIndex: number): string {
  const day = lastDayOfMonth(year, monthIndex);
  return `${String(day).padStart(2, "0")}.${String(monthIndex + 1).padStart(2, "0")}.${year}`;
}

function yearMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function distribute(
  total: number,
  weights: number[],
  rng: () => number,
): number[] {
  if (weights.length === 0) return [];
  const jittered = weights.map((w) => Math.max(0.05, w * (0.75 + rng() * 0.5)));
  const sum = jittered.reduce((a, b) => a + b, 0);
  const parts = jittered.map((w) => roundMoney((total * w) / sum));
  const drift = total - parts.reduce((a, b) => a + b, 0);
  parts[parts.length - 1] = (parts[parts.length - 1] ?? 0) + drift;
  return parts;
}

function toBreakdown(
  items: { id: string; label: string }[],
  values: number[],
): BreakdownItem[] {
  return items.map((item, i) => ({
    id: item.id,
    label: item.label,
    value: values[i] ?? 0,
  }));
}

/**
 * Fake finance timeline for demos — never touches Sheets.
 * Uses era line-item labels from config so charts/filters look real.
 */
export function buildMockTimeline(seed = Date.now()): MonthPoint[] {
  const rng = createRng(seed);
  const army = ERAS.find((e) => e.id === "army") ?? ERAS[0]!;
  const current = ERAS.find((e) => e.id === "current") ?? ERAS[ERAS.length - 1]!;

  const points: MonthPoint[] = [];
  // ~18 army months then ~18 current — enough for timeframe / era filters.
  const armyMonths = 18;
  const currentMonths = 18;
  const totalMonths = armyMonths + currentMonths;

  // End on the previous calendar month so "current year" expense options look right.
  const end = new Date();
  end.setDate(1);
  end.setMonth(end.getMonth() - 1);

  let netWorth = 18_000 + rng() * 12_000;

  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(end.getFullYear(), end.getMonth() - (totalMonths - 1 - i), 1);
    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const era = i < armyMonths ? army : current;
    const eraProgress = i < armyMonths ? i / armyMonths : (i - armyMonths) / currentMonths;

    const isArmy = era.id === army.id;
    const baseIncome = isArmy ? 4_200 : 14_500;
    const income = roundMoney(baseIncome * (0.92 + rng() * 0.2) + (isArmy ? 0 : eraProgress * 2_500));

    const baseExpenses = isArmy ? 3_100 : 9_800;
    const expenses = roundMoney(
      baseExpenses * (0.85 + rng() * 0.35) + (rng() < 0.12 ? 1_500 + rng() * 3_000 : 0),
    );
    const cashflow = income - expenses;

    const growth = cashflow * (0.55 + rng() * 0.35) + (rng() - 0.4) * 800;
    netWorth = Math.max(5_000, netWorth + growth);

    const assetWeights = isArmy
      ? [0.12, 0.35, 0.2, 0.25, 0.08]
      : [0.08, 0.55, 0.22, 0.15];
    const assetValues = distribute(
      roundMoney(netWorth),
      assetWeights.slice(0, era.assets.lineItems.length),
      rng,
    );

    const expenseWeights = era.incomeExpenses.expenseLineItems.map((_, idx) => {
      // Rent / food-ish categories get more weight when present early in the list.
      if (idx === 0) return 0.22;
      if (idx < 3) return 0.12;
      if (idx < 6) return 0.08;
      return 0.04;
    });
    const expenseValues = distribute(
      expenses,
      expenseWeights,
      rng,
    );

    points.push({
      yearMonth: yearMonthKey(year, monthIndex),
      date: formatDisplayDate(year, monthIndex),
      netWorth: roundMoney(netWorth),
      income,
      expenses,
      cashflow,
      eraId: era.id,
      assets: toBreakdown(era.assets.lineItems, assetValues),
      expenseBreakdown: toBreakdown(
        era.incomeExpenses.expenseLineItems,
        expenseValues,
      ),
    });
  }

  return points;
}
