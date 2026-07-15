import { ERAS } from "@/eras.config";
import type { MonthPoint } from "@/lib/types";

/** `all` = every era stitched; otherwise an era `id` from eras.config. */
export type EraFilter = "all" | (string & {});

export type EraOption = {
  value: EraFilter;
  label: string;
};

export const DEFAULT_ERA: EraFilter = "all";

export function eraOptions(): EraOption[] {
  return [
    { value: "all", label: "כל התקופות" },
    ...ERAS.map((era) => ({ value: era.id, label: era.label })),
  ];
}

export function filterByEra(
  data: MonthPoint[],
  era: EraFilter,
): MonthPoint[] {
  if (era === "all") return data;
  return data.filter((p) => p.eraId === era);
}
