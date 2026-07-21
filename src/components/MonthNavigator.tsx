import { hebrewMonthYear } from "@/lib/format";

type Props = {
  /** yearMonth string, e.g. 2026-03 */
  label: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthNavigator({
  label,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: Props) {
  const display = label ? hebrewMonthYear(label) : "—";

  return (
    <nav
      dir="ltr"
      className="flex items-center justify-center gap-3 py-1"
      aria-label="בחירת חודש"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="חודש קודם"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-card text-lg text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition enabled:hover:border-indigo/40 enabled:hover:text-indigo disabled:cursor-not-allowed disabled:opacity-30"
      >
        ‹
      </button>
      <p
        dir="rtl"
        className="min-w-[9rem] text-center text-base font-semibold text-text-primary"
      >
        {display}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="חודש הבא"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-card text-lg text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition enabled:hover:border-indigo/40 enabled:hover:text-indigo disabled:cursor-not-allowed disabled:opacity-30"
      >
        ›
      </button>
    </nav>
  );
}
