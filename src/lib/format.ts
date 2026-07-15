const numberFormatter = new Intl.NumberFormat("he-IL", {
  maximumFractionDigits: 0,
});

const pctNumberFormatter = new Intl.NumberFormat("he-IL", {
  maximumFractionDigits: 1,
});

/** LRM keeps +/- on the visual left of digits inside RTL layouts. */
const LRM = "\u200E";
const MINUS = "\u2212";

function absNumber(value: number): string {
  return numberFormatter.format(Math.abs(Math.round(value)));
}

/** Format as ₪ with thousands separators, e.g. 25,981 ₪; negatives as −25,981 ₪ */
export function formatIls(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = absNumber(value);
  if (value < 0) return `${LRM}${MINUS}${abs} ₪`;
  return `${abs} ₪`;
}

/** Format change with explicit sign on the left: +15,407 ₪ / −12,253 ₪ */
export function formatIlsChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = absNumber(value);
  if (value > 0) return `${LRM}+${abs} ₪`;
  if (value < 0) return `${LRM}${MINUS}${abs} ₪`;
  return `0 ₪`;
}

/** Forced leading sign (income +, expenses −), always left of digits in RTL */
export function formatIlsForcedSign(
  value: number | null | undefined,
  sign: "+" | "−",
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${LRM}${sign}${absNumber(value)} ₪`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = pctNumberFormatter.format(Math.abs(value * 100));
  if (value > 0) return `${LRM}+${abs}%`;
  if (value < 0) return `${LRM}${MINUS}${abs}%`;
  return `${abs}%`;
}

/** Unsigned share of total, e.g. 42.5% — for allocation pie labels. */
export function formatSharePercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${pctNumberFormatter.format(value * 100)}%`;
}

/** Short month label for charts, e.g. מרץ 24 */
const HEBREW_MONTHS = [
  "ינו׳",
  "פבר׳",
  "מרץ",
  "אפר׳",
  "מאי",
  "יונ׳",
  "יול׳",
  "אוג׳",
  "ספט׳",
  "אוק׳",
  "נוב׳",
  "דצמ׳",
];

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  const shortYear = String(year).slice(-2);
  return `${HEBREW_MONTHS[month - 1]} ${shortYear}`;
}

/** Hebrew month name from DD.MM.YYYY or yearMonth */
export function hebrewMonthName(dateOrYearMonth: string): string {
  let month: number | undefined;
  if (dateOrYearMonth.includes(".")) {
    const parts = dateOrYearMonth.split(".");
    month = Number(parts[1]);
  } else if (dateOrYearMonth.includes("-")) {
    month = Number(dateOrYearMonth.split("-")[1]);
  }
  if (!month || month < 1 || month > 12) return dateOrYearMonth;
  const names = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  return names[month - 1];
}

export function signColorClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-text-primary";
  return value > 0 ? "text-green" : "text-coral";
}
