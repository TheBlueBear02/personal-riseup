# Personal Finance Web App — MVP Spec

A private, Riseup-style web app that reads a personal Google Sheets file (net worth + monthly cash flow) and visualizes it with graphs and lightweight insights. Built with Cursor.

This document is the single source of truth for the build. It contains everything a Cursor agent needs to start, plus a checklist of the steps the owner must do by hand.

---

## 1. Goal & scope

**Goal:** Connect an auto-updating Google Sheets file to a web app that shows, over the full timeline:

- **Net worth** (assets total) over time
- **Monthly cash flow** (the Riseup "hero" number: income − expenses)
- **Income vs. expenses** over time
- A small set of **insights** derived purely from those totals

**Design language:** Riseup-inspired — calm, green-forward, one big hero number, minimal chrome. Hebrew UI, right-to-left (RTL). Currency is **₪ (ILS) only**.

**Explicitly OUT of scope for the MVP** (do not build these yet):

- ❌ FIRE math (safe-withdrawal %, "years of living" / שנות מחייה, 3%/4% columns)
- ❌ Category/group breakdowns (needs/wants/housing/subscriptions, active/passive, per-account) — **totals over time only**
- ❌ Multi-currency ($ / €) — those are derived columns; ignore them
- ❌ Any writing back to the sheet — **read-only**
- ❌ Auth / multi-user — single owner, see deployment note

These are deliberate. Everything the app shows is computed from **four totals per month**: net worth, income, expenses, cash flow.

---

## 2. The core challenge: "eras"

The data lives in **one Google Sheets file** but is split across **eras** — life phases that each have their own pair of tabs with **different column layouts**. Today there are two eras (four tabs):

| Era | Assets tab | Income/Expenses tab |
|---|---|---|
| Current | `דוח נכסים` | `הכנסות הוצאות` |
| Army (previous) | `דוח נכסים - צבא` | `הכנסות הוצאות - צבא` |

The naming suffix (` - צבא`) is a human label, **not** machine-parseable. When a new era starts, the owner will manually add a new pair of tabs.

**The design principle that makes this robust:** the app code must know **nothing** about specific column layouts. All era-specific knowledge lives in **one config file** (`eras.config.ts`). Adding an era = adding one config block. The app code never changes.

Because the totals (`סה"כ` / `סה"כ ברוטו`) exist in every era, the timeline is **unbroken** no matter how many eras are added.

---

## 3. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server-side data fetch keeps the Google service-account key off the client; great Cursor support |
| Styling | **Tailwind CSS** | Fast, RTL-friendly |
| Charts | **Recharts** | Simple, declarative, good enough for line/area charts |
| Sheets access | **`googleapis`** (official Node client) | Service-account auth, `spreadsheets.values.get` |
| Font | **Rubik** (or **Heebo**) via `next/font` | Rounded, Hebrew-first — closest free match to Riseup's typography |
| Layout | **Mobile-first, responsive** | Riseup is a phone app; the reference screens are all portrait. Must look right on a phone and gracefully widen on desktop |
| Deployment (MVP) | **localhost** (`next dev`) | Simplest + most private for financial data. Vercel + password is a documented future step, not MVP |

> **Security rule (non-negotiable):** the service-account JSON key is a server-only secret. It must never be imported into a client component or exposed in the browser bundle. All Google Sheets calls happen in server code (route handler or server component).

---

## 4. Architecture & data flow

```
Google Sheets (owner updates monthly)
        │  (read-only, service account)
        ▼
[Server] /lib/sheets.ts ── fetches raw tab values via googleapis
        │
        ▼
[Server] /lib/normalize.ts ── applies eras.config → unified monthly timeline
        │
        ▼
[Server] /app/api/data/route.ts (or server component) ── returns clean JSON
        │
        ▼
[Client] Dashboard + charts (Recharts) + insight cards
```

The **unified timeline** the rest of the app consumes is just an array of monthly points:

```ts
type MonthPoint = {
  yearMonth: string;   // "2024-03"  — the join key across both tables
  date: string;        // display string, e.g. "31.03.2024"
  netWorth: number | null;   // from assets tab total
  income:   number | null;   // from income/expenses tab
  expenses: number | null;
  cashflow: number | null;   // income − expenses (prefer sheet's total; fallback to computed)
  eraId: string;       // which era this month came from
};
```

Assets and income/expenses are **two separate tables** (in most eras, two separate tabs). They are merged into one timeline by **`yearMonth`** key (see §6).

---

## 5. The era config (the heart of the app)

Create `eras.config.ts`. Each era declares, **per table**: the tab name, the date column, and the total column(s), addressed by **spreadsheet column letter** (A, B, C…). Column letters are used instead of header text because the income/expenses tabs have **merged multi-row banner headers** (`הכנסות` / `הוצאות` / `תזרים`) that make header-matching fragile.

> For the MVP (totals only) you do **not** need to list individual line items. A commented `lineItems` field is included as a documented extension point for later; leave it out for now.

```ts
// eras.config.ts
export type AssetsTableConfig = {
  tab: string;          // exact tab name
  dateCol: string;      // column letter of the date
  totalCol: string;     // column letter of net-worth total (סה"כ / סה"כ ברוטו)
};

export type IncomeExpensesTableConfig = {
  tab: string;
  dateCol: string;
  incomeTotalCol: string;    // income סה"כ
  expensesTotalCol: string;  // expenses סה"כ
  cashflowTotalCol: string;  // תזרים סה"כ
};

export type Era = {
  id: string;
  label: string;
  assets: AssetsTableConfig;
  incomeExpenses: IncomeExpensesTableConfig;
};

// ⚠️ Column letters below are PLACEHOLDERS. The owner fills them in — see §11, step F.
export const ERAS: Era[] = [
  {
    id: "current",
    label: "נוכחי",
    assets: {
      tab: "דוח נכסים",
      dateCol: "TODO",     // date column
      totalCol: "TODO",    // סה"כ ברוטו
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
      totalCol: "TODO",    // סה"כ
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
```

**Adding a future era** = append one more object to `ERAS`. No other code changes.

---

## 6. Google Sheets integration spec

### 6.1 Auth
- Auth via **service account** using the `googleapis` package and `google.auth.GoogleAuth`.
- Scope: `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only).
- Credentials come from an env var (see §10). Never a hardcoded path in committed code.

### 6.2 Fetching values
- Use `sheets.spreadsheets.values.get` (or `batchGet` for all tabs in one call).
- **Range = the tab name alone** (e.g. `"דוח נכסים"`) to get the entire used range of that tab.
- **Critical request options:**
  - `valueRenderOption: "UNFORMATTED_VALUE"` → amounts come back as raw numbers (`25981`), so there is **no ₪ symbol or comma to strip**.
  - `dateTimeRenderOption: "FORMATTED_STRING"` → dates come back as readable strings (`"31.03.2024"`) instead of serial numbers.

### 6.3 Column letter → array index
The API returns a 2D array (rows × cells), 0-indexed. Convert config column letters to indices with a helper:
```
"A" → 0, "B" → 1, … "Z" → 25, "AA" → 26, …
colToIndex(letter) = sum over chars of (charCodeUpper - 64), in base 26, minus 1
```

### 6.4 Parsing rules
1. **Row = a real month only if its date cell parses as `DD.MM.YYYY`.** This automatically skips summary rows (`2022` year totals, `סיכום תקופת הצבא`, header rows, blanks). Anything whose date cell isn't a valid `DD.MM.YYYY` is ignored.
2. **Empty cell = 0.** The API drops trailing empty cells, so a row may be shorter than expected — guard every index access and treat missing/`""`/`null` as `0`.
3. **`yearMonth` key** = `YYYY-MM` derived from the parsed date. This is how a month in the assets tab is matched to the same month in the income/expenses tab. (It also gracefully handles the odd `31.11.2023`-style value in the data — we key on year+month, not the exact day.)

### 6.5 Normalization (`normalize.ts`)
- For each era: read the assets tab → produce `{yearMonth, netWorth}` rows; read the income/expenses tab → produce `{yearMonth, income, expenses, cashflow}` rows.
- **Merge** the two on `yearMonth` within the era, then concatenate all eras, then **sort ascending by `yearMonth`**.
- `cashflow`: prefer the sheet's own `תזרים` total; if that cell is empty, fall back to `income − expenses`.
- De-dupe: if two rows share a `yearMonth` (shouldn't happen across eras, but guard anyway), the later era wins.
- Output: `MonthPoint[]` (see §4).

### 6.6 Caching / refresh
- The sheet updates ~monthly, so cache aggressively. Use Next.js server-side caching (e.g. `revalidate` of a few minutes) **plus a manual "Refresh" button** in the UI that re-fetches. No need for real-time.

---

## 7. Features / screens (MVP)

Single page, RTL, Hebrew, green-forward. Sections top to bottom:

1. **Hero — current net worth**
   Big number = latest month's net worth. Under it: month-over-month change (₪ and %), colored green/red.

2. **Cash-flow hero (Riseup signature)**
   Latest month's cash flow (income − expenses) as a prominent number: "נשאר החודש" style. Green if positive, red if negative.

3. **Net worth over time** — line/area chart, full timeline, all eras stitched. Optional subtle era shading/markers.

4. **Income vs. Expenses over time** — two lines (green income, red expenses) on one chart.

5. **Cash flow over time** — bar or line chart, per month; positive/negative colored.

6. **Insight cards** — see §8.

### 7.1 Design tokens (derived from the Riseup reference)

Mirror Riseup's **aesthetic**, not its out-of-scope features. In particular, **do NOT** build: per-category progress bars (סופר/רכב/אוכל בחוץ), "expected to spend" budget bars (צפוי לצאת), or celebration/share cards. Those depend on category data and budgets we cut. Take the palette, cards, hero number, and month-comparison bar chart.

**Colors** (approximate — tune against the screenshots):

| Token | Hex (approx) | Used for |
|---|---|---|
| `green` (positive) | `#2FBE6E` | Positive cash flow, income, hero number when positive, up-bars |
| `coral` (negative) | `#EE7E6E` | Negative cash flow, expenses, down-bars |
| `yellow` | `#F7CE46` | Logo accent, small highlights |
| `indigo` | `#5B60E6` | Primary buttons / interactive accents |
| `text-primary` | `#1C1C1E` | Headings, big numbers |
| `text-secondary` | `#8E8E93` | Small gray labels ("סה"כ הכנסות" etc.) |
| `card-bg` | `#FFFFFF` | Cards |
| `page-bg` | `#F7F7F5` | Warm off-white page background |

**Typography:** Rubik/Heebo. Hero numbers **very large** (~48–60px), bold, colored by sign, with the `₪` symbol. Section labels small, gray, above the value. Hebrew everywhere; thousands separators; sign shown for changes (`+15,407` green / `- 12,253`).

**Cards:** white, rounded corners ~`20px`, soft subtle shadow, generous padding, single-column mobile stack.

**Hero cash-flow card (Riseup signature):** a short personalized line up top → a bold statement (e.g. "פברואר הסתיים בתזרים חיובי") → the giant colored number → a thin row beneath with two sub-stats side by side: **סה"כ הכנסות** (green `+`) and **סה"כ הוצאות** (`-`). This mirrors the reference exactly and uses only totals we have.

**Month-comparison bar chart:** titled like "החודש ביחס לחודשים אחרים". Clean, **no gridlines**, value labels above each bar, month abbreviations below, green bars for positive cash flow and coral for negative, thin zero baseline. This is the cash-flow-over-time chart from §7.

**Month navigator (optional, Riseup-flavored):** a centered `‹ חודש שנה ›` header with chevrons to move the "current" month the heroes describe. Nice-to-have; latest-month-as-hero is acceptable for MVP.

**RTL:** `dir="rtl"` on the root, right-aligned text, chart axes/legends oriented for Hebrew.

---

## 8. Insights (totals-only — no FIRE)

All computed from `MonthPoint[]`, nothing else:

| Insight | Formula |
|---|---|
| Current net worth | latest `netWorth` |
| Net worth MoM change | `latest.netWorth − prev.netWorth` (₪ and %) |
| Latest cash flow | `latest.cashflow` |
| Avg monthly cash flow (last 12 mo) | mean of last 12 `cashflow` |
| Savings rate (latest) | `cashflow / income` as % (guard income = 0) |
| Avg savings rate (last 12 mo) | mean of monthly `cashflow/income` |
| Best / worst cash-flow month | max / min `cashflow` with its date |
| Total saved over full period | `latest.netWorth − first.netWorth` |
| Months tracked | count of `MonthPoint` |

Keep these as small cards. No projections, no withdrawal rates.

---

## 9. File structure (implemented)

```
/src
  /app
    /api/data/route.ts      # server: returns normalized MonthPoint[] as JSON
    actions.ts              # refreshFinanceData server action (revalidateTag)
    page.tsx                # dashboard (server component → client charts)
    layout.tsx              # dir="rtl", Rubik, base styles
  /components
    HeroCards.tsx           # HeroNetWorth + HeroCashflow
    NetWorthChart.tsx
    IncomeExpensesChart.tsx
    CashflowChart.tsx
    InsightCards.tsx
    RefreshButton.tsx
  /lib
    sheets.ts               # googleapis auth + batchGet
    normalize.ts            # eras.config → MonthPoint[]
    data.ts                 # unstable_cache (5 min) + finance-data tag
    columns.ts              # colToIndex helper
    dates.ts                # DD.MM.YYYY parse + yearMonth
    insights.ts             # the §8 calculations
    format.ts               # ₪ / % / Hebrew month formatters
  eras.config.ts            # THE config (owner fills column letters)
.env.local                  # secrets (gitignored)
.env.local.example
.gitignore
```

---

## 10. Environment & secrets

`.env.local` (never committed):

```
GOOGLE_SPREADSHEET_ID=<the long id from the sheet URL, between /d/ and /edit>
GOOGLE_SERVICE_ACCOUNT_KEY=<the full service-account JSON, as a single-line string>
```

- Load the JSON from the env var and pass it to `google.auth.GoogleAuth({ credentials, scopes: [...] })`.
- Ensure `.env.local` and any `*.json` key file are in `.gitignore`.
- (Future, for Vercel: store the key base64-encoded in a project env var and decode server-side.)

---

## 11. Steps the OWNER must do by hand

These cannot be done by the Cursor agent — they need the owner's Google account.

**A. Create a Google Cloud project**
Go to `console.cloud.google.com` → *Select a project* → *New Project* → name it (e.g. "Finance App") → *Create*.

**B. Enable the Sheets API**
*APIs & Services → Library* → search "Google Sheets API" → *Enable*.
(A service account needs **no** OAuth consent screen — skip that.)

**C. Create a service account**
*APIs & Services → Credentials → Create Credentials → Service Account* → give it a name → *Create and continue* → skip optional roles → *Done*.

**D. Create a JSON key**
Open the service account → *Keys* tab → *Add key → Create new key → JSON → Create*. A `.json` file downloads. Keep it safe; this is the secret for `GOOGLE_SERVICE_ACCOUNT_KEY`.

**E. Share the sheet with the service account** *(the step everyone forgets)*
Open the `.json`, copy the `client_email` (looks like `name@project.iam.gserviceaccount.com`). In the Google Sheet → *Share* → paste that email → give it **Viewer** access → Send. Without this, the API returns "not found" even though the sheet exists.

**F. Fill in the config column letters** (`eras.config.ts`)
For each `TODO` in §5: open the relevant tab, click the exact total/date cell, and read the **column letter from the Name Box** (top-left cell reference, e.g. `M31` → column `M`). ⚠️ **Do not count columns by eye** — the sheet is RTL, so visual left/right is reversed; trust the Name Box letter. Fill in:
- Assets tab: date column, net-worth total column
- Income/Expenses tab: date column, income total, expenses total, cash-flow total
- Repeat for **both** eras (four tabs).

**G. Get the spreadsheet ID**
From the sheet URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`. Put it in `.env.local`.

**H. Fill `.env.local`** with the ID and the JSON key (§10), then run `npm run dev`.

---

## 12. Suggested Cursor prompts (build order)

Feed these to the agent roughly in sequence:

1. *"Scaffold a Next.js + TypeScript + Tailwind app, App Router, with `dir=\"rtl\"` and a Hebrew-friendly font in `layout.tsx`. Add Recharts and googleapis."*
2. *"Create `lib/columns.ts` (column-letter→index), `lib/dates.ts` (parse `DD.MM.YYYY`, return `{date, yearMonth}`, reject non-dates), and `eras.config.ts` exactly as specified in the MVP doc §5."*
3. *"Create `lib/sheets.ts`: authenticate with a service account from `GOOGLE_SERVICE_ACCOUNT_KEY`, read-only scope, and fetch full tab values with `valueRenderOption: UNFORMATTED_VALUE` and `dateTimeRenderOption: FORMATTED_STRING`."*
4. *"Create `lib/normalize.ts` implementing MVP doc §6.4–6.5: filter to real-date rows, empty=0, merge assets + income/expenses per era by `yearMonth`, concat all eras, sort ascending. Output `MonthPoint[]`."*
5. *"Create `app/api/data/route.ts` returning the normalized `MonthPoint[]` with short server-side caching."*
6. *"Build the dashboard per §7: HeroNetWorth, HeroCashflow, NetWorthChart, IncomeExpensesChart, CashflowChart, InsightCard, RefreshButton. Riseup-style: green-forward, rounded cards, big numbers, ₪ with thousands separators, RTL, Hebrew labels."*
7. *"Implement `lib/insights.ts` per §8 and wire the insight cards."*

---

## 13. Open items still needed from the owner

- [x] ~~Riseup reference screenshots~~ — received; design tokens captured in §7.1.
- [x] ~~App scaffold & dashboard~~ — implemented under `src/` (see §9). Runs on localhost with a setup banner until credentials + column letters are filled.
- [ ] **Column letters** for all four tabs (§11 step F) — the only thing blocking a working data layer.
- [ ] **Env vars** — `GOOGLE_SPREADSHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env.local` (§11 A–E, G–H).
- [ ] **Deployment choice** — confirm localhost for MVP, or decide on Vercel + a password now (adds a small auth step).

---

## 14. Definition of done (MVP)

- App runs on localhost, authenticates read-only to the sheet.
- Both eras load and stitch into one continuous timeline with **no gaps** at the era boundary.
- Summary/total rows are excluded; empty cells count as 0.
- Hero net worth + hero cash flow display the latest month correctly.
- Three charts (net worth, income vs. expenses, cash flow) render full history, RTL, in ₪.
- Insight cards (§8) compute correctly.
- Refresh button re-pulls the latest sheet data.
- Adding a hypothetical third era requires **only** a new block in `eras.config.ts`.
