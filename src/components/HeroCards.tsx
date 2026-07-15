import {
  formatIls,
  formatIlsChange,
  formatIlsForcedSign,
  formatPercent,
  hebrewMonthName,
  signColorClass,
} from "@/lib/format";
import type { Insights } from "@/lib/insights";

type Props = {
  insights: Insights;
};

export function HeroCashflow({ insights }: Props) {
  const latest = insights.latest;
  const cashflow = insights.latestCashflow;
  const monthName = latest ? hebrewMonthName(latest.date) : "החודש";
  const isPositive = (cashflow ?? 0) >= 0;
  const statement = isPositive
    ? `${monthName} הסתיים בתזרים חיובי`
    : `${monthName} הסתיים בתזרים שלילי`;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">היי 👋 סיכום החודש</p>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">{statement}</h2>
      <p className={`mt-4 text-5xl font-bold tracking-tight sm:text-6xl ${signColorClass(cashflow)}`}>
        {formatIls(cashflow)}
      </p>
      <p className="mt-1 text-sm text-text-secondary">נשאר החודש</p>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
        <div>
          <p className="text-xs text-text-secondary">סה״כ הכנסות</p>
          <p className="mt-1 text-lg font-semibold text-green">
            {formatIlsForcedSign(latest?.income, "+")}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">סה״כ הוצאות</p>
          <p className="mt-1 text-lg font-semibold text-coral">
            {formatIlsForcedSign(latest?.expenses, "−")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HeroNetWorth({ insights }: Props) {
  const change = insights.netWorthMomChange;
  const changePct = insights.netWorthMomChangePct;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">שווי נקי</p>
      <p className="mt-2 text-5xl font-bold tracking-tight text-text-primary sm:text-6xl">
        {formatIls(insights.currentNetWorth)}
      </p>
      <div className={`mt-3 flex flex-wrap items-baseline gap-2 text-sm font-medium ${signColorClass(change)}`}>
        <span>{formatIlsChange(change)}</span>
        {changePct != null && (
          <span className="text-text-secondary">({formatPercent(changePct)})</span>
        )}
        <span className="font-normal text-text-secondary">מול החודש הקודם</span>
      </div>
    </section>
  );
}
