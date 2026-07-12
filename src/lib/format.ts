const ilsFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("he-IL", {
  maximumFractionDigits: 0,
});

const pctFormatter = new Intl.NumberFormat("he-IL", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** Format as ₪ with thousands separators, e.g. ₪25,981 */
export function formatIls(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return ilsFormatter.format(value);
}

/** Format change with explicit sign: +15,407 / −12,253 */
export function formatIlsChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = numberFormatter.format(Math.abs(Math.round(value)));
  if (value > 0) return `+${abs} ₪`;
  if (value < 0) return `−${abs} ₪`;
  return `0 ₪`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return pctFormatter.format(value);
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
