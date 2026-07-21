import {
  formatIls,
  formatIlsChange,
  formatMonthLabel,
  formatPercent,
  signColorClass,
} from "@/lib/format";
import type { MonthPoint } from "@/lib/types";
import type { YoYCompare } from "@/lib/tierOne";

type Props = {
  yoy: YoYCompare;
  current: MonthPoint | null;
};

function pctChange(
  delta: number | null,
  prior: number | null | undefined,
): number | null {
  if (delta == null || prior == null || prior === 0) return null;
  return delta / Math.abs(prior);
}

function Row({
  label,
  current,
  prior,
  delta,
}: {
  label: string;
  current: number | null | undefined;
  prior: number | null | undefined;
  delta: number | null;
}) {
  const pct = pctChange(delta, prior);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 py-2.5">
      <p className="text-center text-xs font-semibold text-text-primary">
        {formatIls(current ?? null)}
      </p>
      <div className="min-w-[5.5rem] text-center">
        <p className="text-base font-semibold text-text-primary">{label}</p>
        <p className={`mt-0.5 text-sm font-medium ${signColorClass(delta)}`}>
          {formatIlsChange(delta)}
        </p>
        <p className={`text-sm font-medium ${signColorClass(pct)}`}>
          {formatPercent(pct)}
        </p>
      </div>
      <p className="text-center text-xs font-semibold text-text-primary">
        {formatIls(prior ?? null)}
      </p>
    </div>
  );
}

export function YoYCompareCard({ yoy, current }: Props) {
  if (!current) return null;

  if (!yoy.prior) {
    return (
      <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-secondary">השוואה לשנה שעברה</p>
        <p className="mt-2 text-lg font-semibold text-text-primary">
          {formatMonthLabel(yoy.currentYm)}
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          אין נתונים לאותו חודש בשנה הקודמת
          {yoy.priorYm ? ` (${formatMonthLabel(yoy.priorYm)})` : ""}.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">השוואה לשנה שעברה</p>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-x-3">
        <p className="text-center text-lg font-bold text-text-primary">
          {formatMonthLabel(yoy.currentYm)}
        </p>
        <div className="min-w-[5.5rem]" aria-hidden />
        <p className="text-center text-lg font-bold text-text-primary">
          {formatMonthLabel(yoy.priorYm!)}
        </p>
      </div>

      <div className="mt-1 divide-y divide-black/5">
        <Row
          label="תזרים"
          current={current.cashflow}
          prior={yoy.prior.cashflow}
          delta={yoy.cashflowDelta}
        />
        <Row
          label="הכנסות"
          current={current.income}
          prior={yoy.prior.income}
          delta={yoy.incomeDelta}
        />
        <Row
          label="הוצאות"
          current={current.expenses}
          prior={yoy.prior.expenses}
          delta={yoy.expensesDelta}
        />
        <Row
          label="שווי נקי"
          current={current.netWorth}
          prior={yoy.prior.netWorth}
          delta={yoy.netWorthDelta}
        />
      </div>
    </section>
  );
}
