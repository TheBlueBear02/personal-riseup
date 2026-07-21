import {
  formatIls,
  formatIlsChange,
  formatIlsForcedSign,
  formatPercent,
  formatSharePercent,
  hebrewMonthName,
  signColorClass,
} from "@/lib/format";
import type { Insights } from "@/lib/insights";

type Props = {
  insights: Insights;
};

/** Combined hero: net worth (visual left) + cashflow with income/expenses (visual right). */
export function HeroSummary({ insights }: Props) {
  const latest = insights.latest;
  const cashflow = insights.latestCashflow;
  const monthName = latest ? hebrewMonthName(latest.date) : "החודש";
  const isPositive = (cashflow ?? 0) >= 0;
  const statement = isPositive
    ? `${monthName} הסתיים בתזרים חיובי`
    : `${monthName} הסתיים בתזרים שלילי`;

  const change = insights.netWorthMomChange;
  const changePct = insights.netWorthMomChangePct;
  const savingsRate = insights.savingsRateLatest;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-2 gap-0">
        {/* First in DOM = visual right in RTL: cashflow + income/expenses */}
        <div className="flex min-w-0 flex-col border-e border-black/5 pe-4">
          <p className="text-sm text-text-secondary">היי 👋 סיכום החודש</p>
          <h2 className="mt-2 text-base font-semibold leading-snug text-text-primary sm:text-xl">
            {statement}
          </h2>
          <p
            className={`mt-4 text-3xl font-bold tracking-tight sm:text-5xl ${signColorClass(cashflow)}`}
          >
            {formatIls(cashflow)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            <span className={signColorClass(savingsRate)}>
              {formatSharePercent(savingsRate)}
            </span>{" "}
            מהכנסה נחסך החודש
          </p>

          <div className="mt-auto grid grid-cols-2 gap-0 border-t border-black/5 pt-4">
            <div className="min-w-0 pe-2">
              <p className="text-xs text-text-secondary">סה״כ הכנסות</p>
              <p className="mt-1 text-base font-semibold text-green sm:text-lg">
                {formatIlsForcedSign(latest?.income, "+")}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">סה״כ הוצאות</p>
              <p className="mt-1 text-base font-semibold text-coral sm:text-lg">
                {formatIlsForcedSign(latest?.expenses, "−")}
              </p>
            </div>
          </div>
        </div>

        {/* Second in DOM = visual left in RTL: net worth */}
        <div className="flex min-w-0 flex-col ps-4">
          <p className="text-sm text-text-secondary">שווי נקי</p>
          <h2 className="mt-2 text-base font-semibold leading-snug text-text-primary sm:text-xl">
            שווי כלל הנכסים החודש
          </h2>
          <p className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {formatIls(insights.currentNetWorth)}
          </p>
          {/* Match right-side subtitle row height so the hairline aligns */}
          <p className="mt-1 text-sm text-transparent select-none" aria-hidden>
            &nbsp;
          </p>

          <div
            className={`mt-auto border-t border-black/5 pt-4 text-sm font-medium ${signColorClass(change)}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{formatIlsChange(change)}</span>
              {changePct != null && (
                <span className="text-text-secondary">({formatPercent(changePct)})</span>
              )}
              <span className="font-normal text-text-secondary">מול החודש הקודם</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
