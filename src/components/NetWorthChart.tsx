"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { ALLOCATION_COLORS } from "@/components/AllocationPieCard";
import { ChartContainer, ChartErrorBoundary } from "@/components/ChartContainer";
import { TimeframeSelect } from "@/components/TimeframeSelect";
import type { MonthPoint } from "@/lib/types";
import {
  formatIls,
  formatMonthLabel,
  formatSharePercent,
} from "@/lib/format";
import { filterByEra, type EraFilter } from "@/lib/eraFilter";
import {
  ALL_TIMEFRAME,
  filterByTimeframe,
  resolveTimeframe,
  timeframeOptions,
  type Timeframe,
} from "@/lib/timeframe";

type Props = {
  data: MonthPoint[];
  era: EraFilter;
};

type NwView = "trend" | "composition";

type StackedRow = {
  yearMonth: string;
  label: string;
  netWorth: number;
  [assetId: string]: string | number;
};

type AssetSeriesItem = { id: string; label: string; color: string };

function CompositionTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: string | number;
    value?: number | string;
    payload?: StackedRow;
  }>;
  label?: string;
  series: AssetSeriesItem[];
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const nw = row?.netWorth ?? 0;
  const rows = payload
    .map((entry) => {
      const id = String(entry.dataKey ?? "");
      const value = Number(entry.value);
      if (!Number.isFinite(value) || value <= 0) return null;
      const meta = series.find((s) => s.id === id);
      const share = nw > 0 ? value / nw : null;
      return {
        id,
        label: meta?.label ?? id,
        color: meta?.color ?? "#8E8E93",
        value,
        share,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-xl bg-card px-3 py-2 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      style={{ direction: "rtl" }}
    >
      <p className="mb-1.5 font-semibold text-text-primary">{label}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 text-text-secondary"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
                aria-hidden
              />
              {r.label}
            </span>
            <span className="tabular-nums text-text-primary">
              {formatIls(r.value)}
              {r.share != null ? ` · ${formatSharePercent(r.share)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Asset ids ordered by total ₪ across the window (largest first) — stable colors. */
function orderedAssetSeries(points: MonthPoint[]): {
  id: string;
  label: string;
  color: string;
}[] {
  const totals = new Map<string, { label: string; sum: number }>();
  for (const point of points) {
    for (const asset of point.assets) {
      if (asset.value <= 0) continue;
      const prev = totals.get(asset.id) ?? { label: asset.label, sum: 0 };
      prev.sum += asset.value;
      prev.label = asset.label;
      totals.set(asset.id, prev);
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1].sum - a[1].sum)
    .map(([id, meta], i) => ({
      id,
      label: meta.label,
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]!,
    }));
}

function buildStackedData(
  points: MonthPoint[],
  series: { id: string }[],
): StackedRow[] {
  return points
    .filter((p) => p.netWorth != null)
    .map((p) => {
      const row: StackedRow = {
        yearMonth: p.yearMonth,
        label: formatMonthLabel(p.yearMonth),
        netWorth: p.netWorth ?? 0,
      };
      const byId = new Map(p.assets.map((a) => [a.id, a.value]));
      for (const s of series) {
        const raw = byId.get(s.id) ?? 0;
        // Negative balances are omitted from the composition stack.
        row[s.id] = raw > 0 ? raw : 0;
      }
      return row;
    });
}

function ViewToggle({
  value,
  onChange,
}: {
  value: NwView;
  onChange: (value: NwView) => void;
}) {
  const options: { value: NwView; label: string }[] = [
    { value: "trend", label: "מגמה" },
    { value: "composition", label: "הרכב" },
  ];

  return (
    <div
      className="inline-flex rounded-full border border-black/10 bg-page p-0.5"
      role="group"
      aria-label="תצוגת שווי נקי"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-card text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function NetWorthChart({ data, era }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(ALL_TIMEFRAME);
  const [view, setView] = useState<NwView>("trend");

  const scoped = filterByEra(data, era);
  const options = timeframeOptions(scoped);
  const effectiveTimeframe = resolveTimeframe(
    timeframe,
    options,
    ALL_TIMEFRAME,
  );
  const windowPoints = filterByTimeframe(scoped, effectiveTimeframe);

  const trendData = useMemo(
    () =>
      windowPoints
        .filter((p) => p.netWorth != null)
        .map((p) => ({
          yearMonth: p.yearMonth,
          label: formatMonthLabel(p.yearMonth),
          netWorth: p.netWorth,
          eraId: p.eraId,
        })),
    [windowPoints],
  );

  const assetSeries = useMemo(
    () => orderedAssetSeries(windowPoints),
    [windowPoints],
  );

  const stackedData = useMemo(
    () => buildStackedData(windowPoints, assetSeries),
    [windowPoints, assetSeries],
  );

  const subtitle =
    view === "composition"
      ? "פירוט נכסים בכל חודש"
      : era === "all"
        ? "כל התקופות מחוברות לטיימליין אחד"
        : "מסונן לפי תקופת החיים שנבחרה";

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text-primary">
            שווי נקי לאורך זמן
          </h3>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ViewToggle value={view} onChange={setView} />
          <TimeframeSelect
            value={effectiveTimeframe}
            options={options}
            onChange={setTimeframe}
          />
        </div>
      </div>

      {view === "trend" ? (
        <ChartErrorBoundary label="net-worth-trend">
          <ChartContainer height={256}>
            {({ width, height }) => (
              <AreaChart
                width={width}
                height={height}
                data={trendData}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2FBE6E" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#2FBE6E"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eee"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#8E8E93" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <Tooltip
                  formatter={(value) => [formatIls(Number(value)), "שווי נקי"]}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { label?: string })?.label ?? ""
                  }
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    direction: "rtl",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#2FBE6E"
                  strokeWidth={2.5}
                  fill="url(#nwFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ChartContainer>
        </ChartErrorBoundary>
      ) : assetSeries.length === 0 || stackedData.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          אין פירוט נכסים להצגה בטווח זה
        </p>
      ) : (
        <ChartErrorBoundary label="net-worth-composition">
          <div>
            <ChartContainer height={256}>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={stackedData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#eee"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#8E8E93" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <CompositionTooltip
                        active={active}
                        payload={payload as unknown as ReadonlyArray<{
                          dataKey?: string | number;
                          value?: number | string;
                          payload?: StackedRow;
                        }>}
                        label={typeof label === "string" ? label : undefined}
                        series={assetSeries}
                      />
                    )}
                  />
                  {assetSeries.map((s) => (
                    <Bar
                      key={s.id}
                      dataKey={s.id}
                      name={s.id}
                      stackId="nw"
                      fill={s.color}
                      isAnimationActive={false}
                      maxBarSize={36}
                    />
                  ))}
                </BarChart>
              )}
            </ChartContainer>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {assetSeries.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-1.5 text-xs text-text-secondary"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </ChartErrorBoundary>
      )}
    </section>
  );
}
