import {
  formatIls,
  formatIlsChange,
  formatPercent,
  signColorClass,
} from "@/lib/format";
import type { BreakdownItem, MonthPoint } from "@/lib/types";
import type { ExpenseAnomaly, Mover, TopMovers } from "@/lib/tierOne";

type Props = {
  movers: TopMovers;
  anomalies: ExpenseAnomaly[];
};

function MoverList({
  title,
  items,
}: {
  title: string;
  items: Mover[];
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-text-secondary">{title}</p>
        <p className="mt-2 text-sm text-text-secondary">אין שינוי משמעותי</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="truncate font-medium text-text-primary">
              {m.label}
            </span>
            <span className={`shrink-0 font-semibold ${signColorClass(m.delta)}`}>
              {formatIlsChange(m.delta)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnomalyList({ anomalies }: { anomalies: ExpenseAnomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-text-secondary">
          מעל הממוצע · כדאי לשים לב
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          אין קטגוריות מעל הממוצע
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">
        מעל הממוצע · כדאי לשים לב
      </p>
      <ul className="mt-2 space-y-2">
        {anomalies.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{a.label}</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                החודש {formatIls(a.value)} · ממוצע {formatIls(a.average)}
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className={`font-semibold ${signColorClass(a.delta)}`}>
                {formatIlsChange(a.delta)}
              </p>
              {a.deltaPct != null && (
                <p className="mt-0.5 text-xs text-coral">
                  {formatPercent(a.deltaPct)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Expense MoM movers + above-average anomalies (assets live in AssetsMoversCard). */
export function TopMoversCard({ movers, anomalies }: Props) {
  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">מה השתנה החודש</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        השינויים הבולטים
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <MoverList title="הוצאות מול חודש קודם" items={movers.expenses} />
        <AnomalyList anomalies={anomalies} />
      </div>
    </section>
  );
}

type AssetColumn = {
  id: string;
  label: string;
  value: number;
  delta: number | null;
};

function buildAssetColumns(
  current: BreakdownItem[],
  previous: BreakdownItem[] | null,
): AssetColumn[] {
  const prevMap = new Map((previous ?? []).map((a) => [a.id, a.value]));
  return current
    .filter((a) => a.value !== 0 || (prevMap.get(a.id) ?? 0) !== 0)
    .map((a) => {
      const prev = previous == null ? null : (prevMap.get(a.id) ?? 0);
      return {
        id: a.id,
        label: a.label,
        value: a.value,
        delta: prev == null ? null : a.value - prev,
      };
    });
}

/** Black outline icons keyed by eras.config asset `id`. */
function AssetIcon({ id }: { id: string }) {
  const common = {
    className: "h-6 w-6 text-text-primary",
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (id) {
    case "checking":
      // Bank / checking account
      return (
        <svg {...common}>
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5 10v8h14v-8" />
          <path d="M9 18v-4h6v4" />
        </svg>
      );
    case "brokerage":
    case "dad_brokerage":
      // Investment portfolio / chart
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-3" />
          <path d="M12 15V8" />
          <path d="M16 15v-6" />
          <path d="M8 9l4-3 4 2" />
        </svg>
      );
    case "pension":
      // Pension / long-term savings shield
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
          <path d="M9.5 12.5 11.5 14.5 15 10.5" />
        </svg>
      );
    case "money_market":
      // Money-market / cash fund coins
      return (
        <svg {...common}>
          <circle cx="9" cy="10" r="5" />
          <path d="M14.5 7.2a5 5 0 1 1 0 9.6" />
          <path d="M9 8v4" />
          <path d="M7.5 10h3" />
        </svg>
      );
    case "child_savings":
      // Child savings / piggy-style gift
      return (
        <svg {...common}>
          <path d="M12 4v3" />
          <path d="M8 7h8l1.5 3H18a3 3 0 0 1 0 6h-1l-1 3H8l-1-3H6a3 3 0 0 1 0-6h.5L8 7Z" />
          <circle cx="16.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      // Generic wallet
      return (
        <svg {...common}>
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H18a1 1 0 0 1 1 1v1.5" />
          <path d="M3 7.5V17a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 17V10a1 1 0 0 0-1-1H9" />
          <circle cx="17" cy="13.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

/** Horizontal asset columns: icon · name · value · MoM change. */
export function AssetsMoversCard({
  current,
  previous,
}: {
  current: MonthPoint | null;
  previous: MonthPoint | null;
}) {
  const columns = current
    ? buildAssetColumns(current.assets, previous?.assets ?? null)
    : [];

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">מה השתנה החודש</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        נכסים מול חודש קודם
      </h2>
      {columns.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          אין פירוט נכסים לחודש זה.
        </p>
      ) : (
        <div className="-mx-1 mt-5 flex gap-0 overflow-x-auto px-1 pb-1">
          {columns.map((col, i) => (
            <div
              key={col.id}
              className={`flex min-w-[6.5rem] flex-1 flex-col items-center px-3 text-center ${
                i < columns.length - 1 ? "border-e border-black/10" : ""
              }`}
            >
              <div className="mb-2.5 flex h-8 items-center justify-center">
                <AssetIcon id={col.id} />
              </div>
              <p className="text-xs font-medium leading-snug text-text-secondary">
                {col.label}
              </p>
              <p className="mt-2 text-sm font-bold tracking-tight text-text-primary">
                {formatIls(col.value)}
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${signColorClass(col.delta)}`}
              >
                {col.delta == null ? "—" : formatIlsChange(col.delta)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
