import {
  formatIls,
  formatIlsChange,
  formatPercent,
  formatSharePercent,
  signColorClass,
} from "@/lib/format";
import type { EraStats } from "@/lib/tierTwo";

type Props = {
  eras: EraStats[];
};

function toneOf(value: number | null): string {
  return signColorClass(value);
}

function EraColumn({ era }: { era: EraStats }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-base font-bold text-text-primary">{era.label}</p>
      <p className="mt-0.5 text-xs text-text-secondary">
        {era.months} חודשים
      </p>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs text-text-secondary">ממוצע תזרים</dt>
          <dd className={`mt-0.5 text-lg font-bold ${toneOf(era.avgCashflow)}`}>
            {formatIls(era.avgCashflow)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">ממוצע שיעור חיסכון</dt>
          <dd
            className={`mt-0.5 text-lg font-bold ${toneOf(era.avgSavingsRate)}`}
          >
            {formatPercent(era.avgSavingsRate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">ממוצע הכנסות</dt>
          <dd className="mt-0.5 text-sm font-semibold text-text-primary">
            {formatIls(era.avgIncome)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">ממוצע הוצאות</dt>
          <dd className="mt-0.5 text-sm font-semibold text-text-primary">
            {formatIls(era.avgExpenses)}
          </dd>
        </div>
      </dl>

      {era.topExpenses.length > 0 && (
        <div className="mt-4 border-t border-black/5 pt-3">
          <p className="text-xs font-medium text-text-secondary">
            הוצאות מובילות · ממוצע חודשי
          </p>
          <ul className="mt-2 space-y-1.5">
            {era.topExpenses.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-text-primary">{item.label}</span>
                <span className="shrink-0 font-semibold text-text-primary">
                  {formatIls(item.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DeltaHint({ eras }: { eras: EraStats[] }) {
  if (eras.length !== 2) return null;
  const [a, b] = eras;
  if (a.avgCashflow == null || b.avgCashflow == null) return null;
  const delta = a.avgCashflow - b.avgCashflow;
  if (delta === 0) return null;

  return (
    <p className={`mt-4 text-sm font-medium ${signColorClass(delta)}`}>
      ממוצע תזרים ב{a.label}: {formatIlsChange(delta)} מול {b.label}
    </p>
  );
}

/** Side-by-side era averages — unique to the multi-era sheet model. */
export function EraComparisonCard({ eras }: Props) {
  if (eras.length < 2) {
    return (
      <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-secondary">השוואת תקופות</p>
        <h2 className="mt-1 text-lg font-semibold text-text-primary">
          השוואה בין תקופות חיים
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          נדרשות לפחות שתי תקופות בנתונים כדי להשוות.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">השוואת תקופות</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        איך השתנה הממוצע בין תקופות
      </h2>

      <div className="mt-5 flex gap-5">
        {eras.map((era, i) => (
          <div
            key={era.eraId}
            className={`min-w-0 flex-1 ${
              i < eras.length - 1 ? "border-e border-black/8 pe-5" : ""
            }`}
          >
            <EraColumn era={era} />
          </div>
        ))}
      </div>

      <DeltaHint eras={eras} />

      {eras.length === 2 &&
        eras[0].avgSavingsRate != null &&
        eras[1].avgSavingsRate != null && (
          <p className="mt-1 text-xs text-text-secondary">
            שיעור חיסכון ממוצע: {formatSharePercent(eras[0].avgSavingsRate)} ב
            {eras[0].label} · {formatSharePercent(eras[1].avgSavingsRate)} ב
            {eras[1].label}
          </p>
        )}
    </section>
  );
}
