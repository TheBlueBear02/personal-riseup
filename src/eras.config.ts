export type AssetsTableConfig = {
  tab: string;
  dateCol: string;
  totalCol: string;
};

export type IncomeExpensesTableConfig = {
  tab: string;
  dateCol: string;
  incomeTotalCol: string;
  expensesTotalCol: string;
  cashflowTotalCol: string;
};

export type Era = {
  id: string;
  label: string;
  assets: AssetsTableConfig;
  incomeExpenses: IncomeExpensesTableConfig;
};

// Column letters below are PLACEHOLDERS. Fill them in from the sheet Name Box (§11F).
export const ERAS: Era[] = [
  {
    id: "current",
    label: "נוכחי",
    assets: {
      tab: "דוח נכסים",
      dateCol: "TODO",
      totalCol: "TODO",
    },
    incomeExpenses: {
      tab: "הכנסות הוצאות",
      dateCol: "TODO",
      incomeTotalCol: "TODO",
      expensesTotalCol: "TODO",
      cashflowTotalCol: "TODO",
    },
  },
  {
    id: "army",
    label: "צבא",
    assets: {
      tab: "דוח נכסים - צבא",
      dateCol: "TODO",
      totalCol: "TODO",
    },
    incomeExpenses: {
      tab: "הכנסות הוצאות - צבא",
      dateCol: "TODO",
      incomeTotalCol: "TODO",
      expensesTotalCol: "TODO",
      cashflowTotalCol: "TODO",
    },
  },
];

export function isConfigComplete(): boolean {
  return ERAS.every((era) => {
    const cols = [
      era.assets.dateCol,
      era.assets.totalCol,
      era.incomeExpenses.dateCol,
      era.incomeExpenses.incomeTotalCol,
      era.incomeExpenses.expensesTotalCol,
      era.incomeExpenses.cashflowTotalCol,
    ];
    return cols.every((c) => c !== "TODO" && /^[A-Z]+$/i.test(c));
  });
}
