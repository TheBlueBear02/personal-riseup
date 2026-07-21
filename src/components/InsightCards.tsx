import {
  formatIls,
  formatIlsChange,
  formatPercent,
} from "@/lib/format";
import type { Insights } from "@/lib/insights";
import type { StreakInfo } from "@/lib/tierOne";

type CardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "indigo";
};

function InsightCard({ label, value, hint, tone = "default" }: CardProps) {
  const toneClass =
    tone === "positive"
      ? "text-green"
      : tone === "negative"
        ? "text-coral"
        : tone === "indigo"
          ? "text-indigo"
          : "text-text-primary";

  return (
    <article className="rounded-[20px] bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </article>
  );
}

type Props = {
  insights: Insights;
  streaks: StreakInfo;
};

function toneOf(value: number | null): "default" | "positive" | "negative" {
  if (value == null || value === 0) return "default";
  return value > 0 ? "positive" : "negative";
}

function streakValue(n: number): string {
  return n > 0 ? String(n) : "—";
}

export function InsightCards({ insights, streaks }: Props) {
  return (
    <section>
      <h3 className="mb-3 text-base font-semibold text-text-primary">תובנות</h3>
      <div className="grid grid-cols-2 gap-3">
        <InsightCard
          label="שווי נקי נוכחי"
          value={formatIls(insights.currentNetWorth)}
        />
        <InsightCard
          label="שינוי חודשי בשווי נקי"
          value={formatIlsChange(insights.netWorthMomChange)}
          hint={
            insights.netWorthMomChangePct != null
              ? formatPercent(insights.netWorthMomChangePct)
              : undefined
          }
          tone={toneOf(insights.netWorthMomChange)}
        />
        <InsightCard
          label="תזרים אחרון"
          value={formatIls(insights.latestCashflow)}
          tone={toneOf(insights.latestCashflow)}
        />
        <InsightCard
          label="ממוצע תזרים · 12 חודשים"
          value={formatIls(insights.avgCashflow12)}
          tone={toneOf(insights.avgCashflow12)}
        />
        <InsightCard
          label="שיעור חיסכון · אחרון"
          value={formatPercent(insights.savingsRateLatest)}
          tone={toneOf(insights.savingsRateLatest)}
        />
        <InsightCard
          label="ממוצע שיעור חיסכון · 12 חודשים"
          value={formatPercent(insights.avgSavingsRate12)}
          tone={toneOf(insights.avgSavingsRate12)}
        />
        <InsightCard
          label="רצף תזרים חיובי"
          value={streakValue(streaks.positiveCashflow)}
          hint="חודשים ברצף"
          tone={streaks.positiveCashflow > 0 ? "positive" : "default"}
        />
        <InsightCard
          label="רצף חיסכון מעל 20%"
          value={streakValue(streaks.highSavings)}
          hint="חודשים ברצף"
          tone={streaks.highSavings > 0 ? "indigo" : "default"}
        />
        <InsightCard
          label="החודש הכי טוב"
          value={
            insights.bestCashflowMonth
              ? formatIls(insights.bestCashflowMonth.value)
              : "—"
          }
          hint={insights.bestCashflowMonth?.date}
          tone="positive"
        />
        <InsightCard
          label="החודש הכי חלש"
          value={
            insights.worstCashflowMonth
              ? formatIls(insights.worstCashflowMonth.value)
              : "—"
          }
          hint={insights.worstCashflowMonth?.date}
          tone="negative"
        />
        <InsightCard
          label="סה״כ שנחסך בתקופה"
          value={formatIls(insights.totalSaved)}
          tone={toneOf(insights.totalSaved)}
        />
        <InsightCard
          label="חודשים במעקב"
          value={String(insights.monthsTracked)}
        />
      </div>
    </section>
  );
}
