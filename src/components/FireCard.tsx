import { formatIls } from "@/lib/format";
import type { FireSnapshot } from "@/lib/wealth";

type Props = {
  fire: FireSnapshot;
};

function formatYears(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("he-IL", { maximumFractionDigits: 1 })} שנים`;
}

/** Lightweight FIRE snapshot: years of living + 4% withdrawal. */
export function FireCard({ fire }: Props) {
  const thinHistory = fire.expenseMonths < 3;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">עושר לטווח ארוך</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        שנות מחייה וכלל 4%
      </h2>
      <p className="mt-1 text-xs text-text-secondary">
        מבוסס על שווי נקי אחרון וממוצע הוצאות
        {fire.expenseMonths > 0
          ? ` · ${fire.expenseMonths} חודשים`
          : ""}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-secondary">שנות מחייה</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-indigo">
            {formatYears(fire.yearsOfLiving)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            שווי נקי ÷ הוצאות שנתיות
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">משיכה שנתית · 4%</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            {formatIls(fire.safeWithdrawal4pct)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            לשנה · מתוך השווי הנקי
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-4">
        <div>
          <p className="text-xs text-text-secondary">שווי נקי נוכחי</p>
          <p className="mt-1 text-base font-bold text-text-primary">
            {formatIls(fire.netWorth)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">הוצאות שנתיות משוערות</p>
          <p className="mt-1 text-base font-bold text-text-primary">
            {formatIls(fire.annualExpenses)}
          </p>
        </div>
      </div>

      {thinHistory && (
        <p className="mt-4 text-xs text-text-secondary">
          מעט חודשי הוצאות במעקב — המספרים יתחדדו עם הזמן.
        </p>
      )}
    </section>
  );
}
