export type LineItem = {
  id: string;
  label: string;
  col: string;
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
      expenseLineItems: [
        { id: "food", label: "אוכל", col: "K" },
        { id: "groceries_shared", label: "מצרכים", col: "L" },
        { id: "eating_out", label: "אוכל בחוץ", col: "M" },
        { id: "phone", label: "פלאפון", col: "N" },
        { id: "transit", label: "תחבורה ציבורית", col: "O" },
        { id: "studies", label: "לימודים", col: "P" },
        { id: "nat_insurance", label: "ביטוח לאומי", col: "Q" },
        { id: "spotify", label: "Spotify", col: "R" },
        { id: "education", label: "השכלה", col: "S" },
        { id: "shows", label: "הופעות", col: "T" },
        { id: "projects", label: "פרוייקטים", col: "U" },
        { id: "misc", label: "שונות", col: "V" },
        { id: "rent", label: "שכירות", col: "W" },
        { id: "electricity", label: "חשמל", col: "X" },
        { id: "water", label: "מים", col: "Y" },
        { id: "arnona", label: "ארנונה", col: "Z" },
        { id: "internet", label: "אינטרנט", col: "AA" },
        { id: "cursor", label: "Cursor", col: "AB" },
        { id: "claude", label: "Claude", col: "AC" },
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
      expenseLineItems: [
        { id: "food", label: "אוכל", col: "J" },
        { id: "phone", label: "פלאפון", col: "M" },
        { id: "tv", label: "סלקום TV", col: "N" },
        { id: "tickets", label: "כרטיסים למכבי חיפה", col: "O" },
        { id: "education", label: "השכלה", col: "P" },
        { id: "misc", label: "שונות", col: "Q" },
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
