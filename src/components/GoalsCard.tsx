"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  formatIls,
  formatSharePercent,
} from "@/lib/format";
import type { MonthPoint } from "@/lib/types";
import {
  goalHistorySeries,
  type GoalProgress,
} from "@/lib/wealth";

const GoalHistoryChart = dynamic(
  () =>
    import("@/components/GoalHistoryChart").then((m) => m.GoalHistoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="mt-3 h-[200px] animate-pulse rounded-xl bg-page" />
    ),
  },
);

type Props = {
  goals: GoalProgress[];
  data: MonthPoint[];
};

function ProgressBar({ progress, complete }: { progress: number; complete: boolean }) {
  const width = Math.min(100, Math.max(0, progress * 100));
  return (
    <div
      className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/5"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] ${
          complete ? "bg-green" : "bg-indigo"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function metricLabel(item: GoalProgress): string {
  if (item.goal.metric === "netWorth") return "שווי נקי";
  if (item.goal.hint) return item.goal.hint.split("·")[0]!.trim();
  return "יתרה";
}

function GoalRow({
  item,
  data,
  expanded,
  onToggle,
}: {
  item: GoalProgress;
  data: MonthPoint[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { goal, target, current, remaining, progress, complete } = item;
  const pct = progress != null ? Math.min(progress, 1) : null;
  const series = useMemo(
    () => (expanded ? goalHistorySeries(data, goal) : []),
    [expanded, data, goal],
  );

  return (
    <div className="border-t border-black/5 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col text-start transition hover:opacity-90"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-text-primary">{goal.label}</p>
              <span
                className={`inline-block text-[10px] text-text-secondary transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                ▾
              </span>
            </div>
            {goal.hint && (
              <p className="mt-0.5 text-xs text-text-secondary">{goal.hint}</p>
            )}
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-text-primary">
            {pct != null ? formatSharePercent(pct) : "—"}
          </p>
        </div>

        {progress != null ? (
          <ProgressBar progress={progress} complete={complete} />
        ) : (
          <p className="mt-3 text-sm text-text-secondary">אין נתון נוכחי ליעד</p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-secondary">
          <span>
            {formatIls(current)}
            {" / "}
            {formatIls(target)}
          </span>
          {complete ? (
            <span className="font-semibold text-green">הושלם</span>
          ) : remaining != null ? (
            <span>נותרו {formatIls(remaining)}</span>
          ) : null}
        </div>
      </button>

      {expanded && (
        <div className="mt-1 border-t border-black/5 pt-1">
          <GoalHistoryChart
            goalId={goal.id}
            series={series}
            target={target}
            metricLabel={metricLabel(item)}
          />
        </div>
      )}
    </div>
  );
}

/** Progress meters toward config goals; tap a row to expand history + target line. */
export function GoalsCard({ goals, data }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-secondary">יעדים</p>
        <p className="mt-3 text-sm text-text-secondary">
          אין יעדים מוגדרים ב־goals.config
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">יעדים ארוכי טווח</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        התקדמות לעבר היעדים
      </h2>
      <p className="mt-1 text-xs text-text-secondary">
        לחצו על יעד כדי לראות היסטוריה מול קו היעד
      </p>
      <div className="mt-5 space-y-4">
        {goals.map((item) => (
          <GoalRow
            key={item.goal.id}
            item={item}
            data={data}
            expanded={expandedId === item.goal.id}
            onToggle={() =>
              setExpandedId((id) =>
                id === item.goal.id ? null : item.goal.id,
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
