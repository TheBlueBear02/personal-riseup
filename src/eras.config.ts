/**
 * Expense categories from sheet row-2 banners under הוצאות.
 * צרכים (+ דירה) → need; מותרות (+ מנויים) → luxury.
 * Site-only overrides allowed (e.g. אוכל בחוץ → luxury); never write back to the sheet.
 */
export type ExpenseKind = "need" | "luxury";

export type LineItem = {
  id: string;
  label: string;
  col: string;
  /** Only used on expenseLineItems — drives needs vs luxuries split. */
  kind?: ExpenseKind;
};

export type AssetsTableConfig = {
  tab: string;
  dateCol: string;
  totalCol: string;
  /** Individual asset columns (excluding the סה״כ total). */
  lineItems: LineItem[];
};

export type IncomeExpensesTableConfig = {
  tab: string;
  dateCol: string;
  incomeTotalCol: string;
  expensesTotalCol: string;
  cashflowTotalCol: string;
  /** Individual expense columns (excluding the expenses סה״כ total). */
  expenseLineItems: LineItem[];
};

export type Era = {
  id: string;
  label: string;
  assets: AssetsTableConfig;
  incomeExpenses: IncomeExpensesTableConfig;
};

// Column letters from the sheet Name Box (§11F).
export const ERAS: Era[] = [
  {
    id: "current",
    label: "נוכחי",
    assets: {
      tab: "דוח נכסים",
      dateCol: "A",
      totalCol: "F",
      lineItems: [
        { id: "checking", label: "עו״ש", col: "B" },
        { id: "brokerage", label: "תיק השקעות IB", col: "C" },
        { id: "pension", label: "קופת גמל", col: "D" },
        { id: "money_market", label: "קרן כספית בבנק", col: "E" },
      ],
    },
    incomeExpenses: {
      tab: "הכנסות הוצאות",
      dateCol: "A",
      incomeTotalCol: "I",
      expensesTotalCol: "AD",
      cashflowTotalCol: "AH",
      // Sheet banners: צרכים K–Q · מותרות R–V · דירה W–AA · מנויים AB–AC
      // Site override: אוכל בחוץ (M) → luxury (sheet still groups it under צרכים)
      expenseLineItems: [
        { id: "food", label: "אוכל", col: "K", kind: "need" },
        { id: "groceries_shared", label: "מצרכים", col: "L", kind: "need" },
        { id: "eating_out", label: "אוכל בחוץ", col: "M", kind: "luxury" },
        { id: "phone", label: "פלאפון", col: "N", kind: "need" },
        { id: "transit", label: "תחבורה ציבורית", col: "O", kind: "need" },
        { id: "studies", label: "לימודים", col: "P", kind: "need" },
        { id: "nat_insurance", label: "ביטוח לאומי", col: "Q", kind: "need" },
        { id: "spotify", label: "Spotify", col: "R", kind: "luxury" },
        { id: "education", label: "השכלה", col: "S", kind: "luxury" },
        { id: "shows", label: "הופעות", col: "T", kind: "luxury" },
        { id: "projects", label: "פרוייקטים", col: "U", kind: "luxury" },
        { id: "misc", label: "שונות", col: "V", kind: "luxury" },
        { id: "rent", label: "שכירות", col: "W", kind: "need" },
        { id: "electricity", label: "חשמל", col: "X", kind: "need" },
        { id: "water", label: "מים", col: "Y", kind: "need" },
        { id: "arnona", label: "ארנונה", col: "Z", kind: "need" },
        { id: "internet", label: "אינטרנט", col: "AA", kind: "need" },
        { id: "cursor", label: "Cursor", col: "AB", kind: "luxury" },
        { id: "claude", label: "Claude", col: "AC", kind: "luxury" },
      ],
    },
  },
  {
    id: "army",
    label: "צבא",
    assets: {
      tab: "דוח נכסים - צבא",
      dateCol: "A",
      totalCol: "G",
      lineItems: [
        { id: "checking", label: "עו״ש", col: "B" },
        { id: "brokerage", label: "תיק השקעות Pepper", col: "C" },
        { id: "dad_brokerage", label: "תיק השקעות דרך אבא", col: "D" },
        { id: "pension", label: "קופת גמל", col: "E" },
        { id: "child_savings", label: "חסכון לכל ילד", col: "F" },
      ],
    },
    incomeExpenses: {
      tab: "הכנסות הוצאות - צבא",
      dateCol: "A",
      incomeTotalCol: "H",
      expensesTotalCol: "R",
      cashflowTotalCol: "V",
      // Sheet banners: צרכים J · מותרות M–Q
      expenseLineItems: [
        { id: "food", label: "אוכל", col: "J", kind: "need" },
        { id: "phone", label: "פלאפון", col: "M", kind: "luxury" },
        { id: "tv", label: "סלקום TV", col: "N", kind: "luxury" },
        { id: "tickets", label: "כרטיסים למכבי חיפה", col: "O", kind: "luxury" },
        { id: "education", label: "השכלה", col: "P", kind: "luxury" },
        { id: "misc", label: "שונות", col: "Q", kind: "luxury" },
      ],
    },
  },
];

export function isConfigComplete(): boolean {
  return ERAS.every((era) => {
    const cols = [
      era.assets.dateCol,
      era.assets.totalCol,
      ...era.assets.lineItems.map((item) => item.col),
      era.incomeExpenses.dateCol,
      era.incomeExpenses.incomeTotalCol,
      era.incomeExpenses.expensesTotalCol,
      era.incomeExpenses.cashflowTotalCol,
      ...era.incomeExpenses.expenseLineItems.map((item) => item.col),
    ];
    return (
      era.assets.lineItems.length > 0 &&
      era.incomeExpenses.expenseLineItems.length > 0 &&
      cols.every((c) => c !== "TODO" && /^[A-Z]+$/i.test(c))
    );
  });
}
