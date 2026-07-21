"use client";

import { useState } from "react";
import { formatIls, formatSharePercent } from "@/lib/format";
import type { BreakdownItem } from "@/lib/types";
import type { NeedsLuxuriesSplit } from "@/lib/tierOne";

type Props = {
  split: NeedsLuxuriesSplit;
};

function ExpenseList({ items }: { items: BreakdownItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-2 text-xs text-text-secondary">אין פריטים בקטגוריה זו</p>
    );
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
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
  );
}

export function NeedsLuxuriesCard({ split }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = split.needs + split.luxuries + split.unclassified;
  if (total <= 0) {
    return (
      <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-text-secondary">צרכים מול מותרות</p>
        <p className="mt-3 text-sm text-text-secondary">אין פירוט הוצאות לחודש זה</p>
      </section>
    );
  }

  const needsPct = split.needsShare ?? 0;
  const luxuriesPct = split.luxuriesShare ?? 0;
  const otherPct = split.unclassified > 0 ? split.unclassified / total : 0;

  return (
    <section className="rounded-[20px] bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-sm text-text-secondary">צרכים מול מותרות</p>
      <h2 className="mt-1 text-lg font-semibold text-text-primary">
        כמה מההוצאות הולכות לצרכים
      </h2>

      <div
        className="mt-5 flex h-3 overflow-hidden rounded-full bg-black/5"
        role="img"
        aria-label={`צרכים ${formatSharePercent(needsPct)}, מותרות ${formatSharePercent(luxuriesPct)}`}
      >
        {needsPct > 0 && (
          <div
            className="bg-indigo transition-[width]"
            style={{ width: `${needsPct * 100}%` }}
          />
        )}
        {luxuriesPct > 0 && (
          <div
            className="bg-green transition-[width]"
            style={{ width: `${luxuriesPct * 100}%` }}
          />
        )}
        {otherPct > 0 && (
          <div
            className="bg-text-secondary/40 transition-[width]"
            style={{ width: `${otherPct * 100}%` }}
          />
        )}
      </div>

      {/* RTL: צרכים at start (right), מותרות flush at end (visual left of the bar). */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo" />
            <p className="text-xs text-text-secondary">צרכים</p>
          </div>
          <p className="mt-1 text-xl font-bold text-text-primary">
            {formatIls(split.needs)}
          </p>
          <p className="text-xs text-text-secondary">
            {formatSharePercent(split.needsShare)}
          </p>
        </div>
        <div className="text-end">
          <div className="flex items-center justify-end gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green" />
            <p className="text-xs text-text-secondary">מותרות</p>
          </div>
          <p className="mt-1 text-xl font-bold text-text-primary">
            {formatIls(split.luxuries)}
          </p>
          <p className="text-xs text-text-secondary">
            {formatSharePercent(split.luxuriesShare)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full border border-black/8 bg-page py-2 text-sm font-medium text-text-primary transition hover:border-indigo/40 hover:text-indigo"
      >
        {expanded ? "הסתר פירוט" : "הצג פירוט הוצאות"}
        <span
          className={`inline-block text-xs transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-5 border-t border-black/5 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo" />
              <p className="text-sm font-semibold text-text-primary">צרכים</p>
              <p className="text-xs text-text-secondary">
                {formatIls(split.needs)}
              </p>
            </div>
            <ExpenseList items={split.needsItems} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <p className="text-sm font-semibold text-text-primary">מותרות</p>
              <p className="text-xs text-text-secondary">
                {formatIls(split.luxuries)}
              </p>
            </div>
            <ExpenseList items={split.luxuriesItems} />
          </div>
          {split.unclassifiedItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-text-secondary/40" />
                <p className="text-sm font-semibold text-text-primary">ללא סיווג</p>
                <p className="text-xs text-text-secondary">
                  {formatIls(split.unclassified)}
                </p>
              </div>
              <ExpenseList items={split.unclassifiedItems} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
