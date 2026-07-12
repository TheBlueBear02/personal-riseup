export type ParsedDate = {
  /** Display string as it appeared in the sheet, e.g. "31.03.2024" */
  date: string;
  /** Join key across tables, e.g. "2024-03" */
  yearMonth: string;
};

const DATE_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * Parse a DD.MM.YYYY cell value. Returns null for summary/header/blank rows.
 * Odd day values (e.g. 31.11.2023) are accepted — we key on year+month only.
 */
export function parseSheetDate(value: unknown): ParsedDate | null {
  if (value == null || value === "") return null;

  const text = String(value).trim();
  const match = DATE_RE.exec(text);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  return { date: text, yearMonth };
}
