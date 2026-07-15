import type { MonthPoint } from "@/lib/types";

/** `all` = full history; `last12` = trailing 12 months; otherwise a calendar year e.g. `"2024"`. */
export type Timeframe = "all" | "last12" | (string & {});

export type TimeframeOption = {
  value: Timeframe;
  label: string;
};

export const DEFAULT_TIMEFRAME: Timeframe = "last12";
export const ALL_TIMEFRAME: Timeframe = "all";

export function yearsInData(data: MonthPoint[]): string[] {
  const years = new Set<string>();
  for (const point of data) {
    const year = point.yearMonth.slice(0, 4);
    if (/^\d{4}$/.test(year)) years.add(year);
  }
  return [...years].sort((a, b) => b.localeCompare(a));
}

export function timeframeOptions(data: MonthPoint[]): TimeframeOption[] {
  return [
    { value: "all", label: "הכל" },
    { value: "last12", label: "12 חודשים" },
    ...yearsInData(data).map((year) => ({ value: year, label: year })),
  ];
}

export function filterByTimeframe(
  data: MonthPoint[],
  timeframe: Timeframe,
): MonthPoint[] {
  if (timeframe === "all") {
    return data;
  }
  if (timeframe === "last12") {
    return data.slice(-12);
  }
  return data.filter((p) => p.yearMonth.startsWith(`${timeframe}-`));
}

/** Keeps the current selection when still valid after an era scope change. */
export function resolveTimeframe(
  timeframe: Timeframe,
  options: TimeframeOption[],
  fallback: Timeframe = DEFAULT_TIMEFRAME,
): Timeframe {
  if (options.some((opt) => opt.value === timeframe)) return timeframe;
  return options.some((opt) => opt.value === fallback)
    ? fallback
    : (options[0]?.value ?? fallback);
}
