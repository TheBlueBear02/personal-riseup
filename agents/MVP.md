# Personal Finance Web App — MVP Spec

A private, Riseup-style web app that reads a personal Google Sheets file (net worth + monthly cash flow) and visualizes it with graphs and lightweight insights. Built with Cursor.

This document is the single source of truth for the build. It contains everything a Cursor agent needs to start, plus a checklist of the steps the owner must do by hand.

---

## 1. Goal & scope

**Goal:** Connect an auto-updating Google Sheets file to a web app that shows, over the full timeline:

- **Net worth** (assets total) over time
- **Asset allocation** (selected month via month navigator): donut embedded in נכסים והקצאה; % on the asset columns (donut slice colors)
- **Expense breakdown**: pie embedded in צרכים מול מותרות (month navigator); category % · ₪ in the expand list
- **Expense type history**: pick a type → monthly amounts over time (with timeframe filter)
- **Monthly cash flow** (the Riseup "hero" number: income − expenses)
- **Income vs. expenses** over time
- A small set of **insights** derived from those totals + latest allocation
- **Tier‑1 extras** (all from existing monthly totals / config — no bank sync):
  - Month navigator on heroes
  - Savings rate as a one-line caption under the cashflow hero number (no separate card / sparkline)
  - Expense categories above trailing average (anomaly cards)
  - Year-over-year same-month compare
  - Needs vs luxuries spend split (`kind` on expense line items; from sheet banners צרכים / מותרות)
  - Positive-cashflow / high-savings streaks
  - Top movers (expense + asset MoM deltas)
- **Tier‑2 extras** (existing timeline / config only):
  - Asset MoM + **allocation drift** (share of NW + MoM pp change per asset)
  - **Era comparison** card (avg cashflow, savings rate, expense mix per era)
  - **Year summary** / annual report card (income, expenses, saved, best/worst month, top categories)
- **Wealth / long-term path:**
  - **Goals / targets** — progress meters from `goals.config.ts` (NW milestones, emergency fund via asset ids)
  - **FIRE snapshot** — שנות מחייה (NW ÷ annual expenses) + 4% safe-withdrawal income

**Design language:** Riseup-inspired — calm, green-forward, one big hero number, minimal chrome. Hebrew UI, right-to-left (RTL). Currency is **₪ (ILS) only**.

**Explicitly OUT of scope for the MVP** (do not build these yet):

- ❌ Full FIRE planning (glide paths, contribution schedules, Monte Carlo) — only the lightweight snapshot above
- ❌ Income-side category pie (work / passive / freelance) — income stays total-only for now
- ❌ Budget / "expected to spend" bars
- ❌ Multi-currency ($ / €) — those are derived columns; ignore them
- ❌ Any writing back to the sheet — **read-only**
- ❌ Multi-user accounts — single owner; site uses a shared `SITE_PASSWORD` gate only (see §3)

Totals timeline is still the core. Asset and expense **types** come from `eras.config` line-item lists, not from scanning sheet headers.

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
| Styling | **Tailwind CSS** | Fast, RTL-friendly. Global `cursor: pointer` on `button` / button-like inputs in `globals.css` |
| Charts | **Recharts** | Simple, declarative, good enough for line/area charts. **Must pin `react-is` to the same major as React** (via `dependencies` + `overrides`) — Recharts otherwise pulls `react-is@16`, and chart children render blank under React 19. Charts load via `ClientCharts` → `dynamic(..., { ssr: false })` (must be in a Client Component in Next 16), sized by `ChartContainer` (viewport fallback, never zero width, no focus outlines on `.recharts-wrapper` / `.recharts-surface`), and `isAnimationActive={false}` for mobile Safari |
| Sheets access | **`googleapis`** (official Node client) | Service-account auth, `spreadsheets.values.get` |
| Font | **Rubik** (or **Heebo**) via `next/font` | Rounded, Hebrew-first — closest free match to Riseup's typography |
| Layout | **Mobile-first, responsive** | Riseup is a phone app; the reference screens are all portrait. Must look right on a phone and gracefully widen on desktop |
| Deployment (MVP) | **localhost** (`next dev`) + **site password gate** | Gate at `/` (shared `SITE_PASSWORD`); dashboard at `/dashboard`. Middleware + httpOnly cookie protect pages and `/api/*`. Public **mockup** at `/mockup` (fake numbers, no Sheets) linked from the gate for demos. **Phone on LAN:** run `npm run dev -- -H 0.0.0.0`, put your PC LAN IP in `next.config.ts` → `allowedDevOrigins` (otherwise SSR numbers load but chart JS is blocked) |

> **Security rule (non-negotiable):** the service-account JSON key is a server-only secret. It must never be imported into a client component or exposed in the browser bundle. All Google Sheets calls happen in server code (route handler or server component). `SITE_PASSWORD` is likewise server-only — never read it in a Client Component. The site gate is **not** Google Sheets auth; Sheets still use the service account.

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
type BreakdownItem = {
  id: string;
  label: string;
  value: number;
};

type MonthPoint = {
  yearMonth: string;   // "2024-03"  — the join key across both tables
  date: string;        // display string, e.g. "31.03.2024"
  netWorth: number | null;   // from assets tab total
  income:   number | null;   // from income/expenses tab
  expenses: number | null;
  cashflow: number | null;   // income − expenses (prefer sheet's total; fallback to computed)
  eraId: string;       // which era this month came from
  assets: BreakdownItem[];           // per-type amounts from assets lineItems
  expenseBreakdown: BreakdownItem[]; // per-type amounts from expenseLineItems
};
```

Assets and income/expenses are **two separate tables** (in most eras, two separate tabs). They are merged into one timeline by **`yearMonth`** key (see §6).

---

## 5. The era config (the heart of the app)

Create `eras.config.ts`. Each era declares, **per table**: the tab name, the date column, the total column(s), assets **`lineItems`**, and income/expenses **`expenseLineItems`** — addressed by **spreadsheet column letter** (A, B, C…). Column letters are used instead of header text because the income/expenses tabs have **merged multi-row banner headers** (`הכנסות` / `הוצאות` / `תזרים`) that make header-matching fragile.

```ts
// eras.config.ts
export type ExpenseKind = "need" | "luxury";

export type LineItem = {
  id: string;
  label: string; // Hebrew (or English) label shown in allocation pies
  col: string;
  /** On expenseLineItems only — drives needs vs luxuries split UI. */
  kind?: ExpenseKind;
};

export type AssetsTableConfig = {
  tab: string;          // exact tab name
  dateCol: string;      // column letter of the date
  totalCol: string;     // column letter of net-worth total (סה"כ / סה"כ ברוטו)
  lineItems: LineItem[]; // asset types only — never include the סה״כ column
};

export type IncomeExpensesTableConfig = {
  tab: string;
  dateCol: string;
  incomeTotalCol: string;    // income סה"כ
  expensesTotalCol: string;  // expenses סה"כ
  cashflowTotalCol: string;  // תזרים סה"כ
  expenseLineItems: LineItem[]; // expense types — never include the expenses סה״כ column; set kind
};

export type Era = {
  id: string;
  label: string;
  assets: AssetsTableConfig;
  incomeExpenses: IncomeExpensesTableConfig;
};
```

**Current era asset line items (דוח נכסים):** B עו״ש · C תיק השקעות IB · D קופת גמל · E קרן כספית בבנק (total = F).

**Army era asset line items (דוח נכסים - צבא):** B עו״ש · C תיק השקעות Pepper · D תיק דרך אבא · E קופת גמל · F חסכון לכל ילד (total = G).

**Current era expense line items (הכנסות הוצאות):** K–AC individual categories (אוכל, שכירות, Cursor, …); expenses total = AD.

**Army era expense line items (הכנסות הוצאות - צבא):** J אוכל · M פלאפון · N סלקום TV · O כרטיסים · P השכלה · Q שונות (total = R).

**Adding a future era** = append one more object to `ERAS` (including `lineItems` + `expenseLineItems`). No other code changes.

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
- For each era: read the assets tab → produce `{yearMonth, netWorth, assets[]}` rows; read the income/expenses tab → produce `{yearMonth, income, expenses, cashflow, expenseBreakdown[]}` rows.
- **Merge** the two on `yearMonth` within the era, then concatenate all eras, then **sort ascending by `yearMonth`**.
- `cashflow`: prefer the sheet's own `תזרים` total; if that cell is empty, fall back to `income − expenses`.
- De-dupe: if two rows share a `yearMonth` (shouldn't happen across eras, but guard anyway), the later era wins.
- Output: `MonthPoint[]` (see §4).

### 6.6 Caching / refresh
- The sheet updates ~monthly, so cache aggressively. Use Next.js server-side caching (e.g. `revalidate` of a few minutes) **plus a manual "Refresh" button** in the UI that re-fetches. No need for real-time.

---

## 7. Features / screens (MVP)

Single page, RTL, Hebrew, green-forward. Sections top to bottom:

0. **Month navigator** — centered `‹ חודש שנה ›` (`MonthNavigator`, `dir="ltr"` so ‹ = older, › = newer). Owned by client `DashboardTop`; selected index drives heroes + all Tier‑1 cards below. Defaults to the newest month.

1. **Combined hero (`HeroSummary`)** — one card, two halves (RTL):
   - **Right half — cash flow (Riseup signature):** personalized greeting → bold month statement → selected month's cash flow (income − expenses) as a prominent number, green/red by sign → one-line savings caption replacing the old "נשאר בחודש זה" — e.g. **39.6% מהכנסה נחסך החודש** (`cashflow / income`, no sparkline) → bottom row with **סה״כ הכנסות** and **סה״כ הוצאות** flush side-by-side (`gap-0`).
   - **Left half — net worth:** two titles matching right-side sizes — small **שווי נקי**, then semibold **שווי כלל הנכסים החודש** → big number → same bottom hairline as the right half → MoM change (₪ and %) below the line, aligned with the income/expenses row. Vertical hairline separates the halves.

2d. **מה השתנה החודש** — two-column card: expense MoM movers + above-average expense anomalies (up to 3 categories above trailing 6‑mo avg). Empty anomaly column when history is thin or all at/below average.

2d2. **Expense breakdown (pie)** — embedded inside **צרכים מול מותרות** (`NeedsLuxuriesCard`), under the needs/luxuries bar totals and **above** the “הצג פירוט הוצאות” button. Locked to the month navigator. Donut only — **no legend list** under the pie (`AllocationPieCard` `embedded` + `showLegend={false}`). Category detail (₪ + **% of month expenses**) lives in the expand list.

2f. **Needs vs luxuries (צרכים מול מותרות)** — after expense movers. Bar + totals from `expenseLineItems[].kind` in `eras.config`, based on the sheet’s row‑2 banners under הוצאות (`need` indigo / `luxury` green), with site-only overrides allowed (sheet is never written). Current era: צרכים K–Q (except אוכל בחוץ) + דירה W–AA → `need`; מותרות R–V + אוכל בחוץ (M) + מנויים AB–AC → `luxury`. Army era: צרכים J → `need`; מותרות M–Q → `luxury`. Under the bar: **צרכים** on the right, **מותרות** flush on the visual left → **expense pie** → expand control. Expand reveals each expense line under its category with **share % (donut slice color) · ₪** plus a matching color dot (sorted largest-first; optional unclassified group). Unclassified kinds (if any) are a gray remainder on the bar.

2e. **נכסים והקצאה מול חודש קודם** — horizontal columns per asset (`AssetsMoversCard` via `computeAllocationDrift`): larger outline icon → name → **allocation %** (donut slice color, above the ₪) → larger ₪ value → MoM ₪ change → MoM allocation pp drift at the bottom. Scrolls horizontally when many types. Below the columns: **embedded asset allocation pie** (`AssetAllocationChart` `embedded` — donut only, **no legend list**; % lives on the columns).

2e2. **Asset allocation (pie)** — inside §7.2e (not a standalone card). Locked to the month navigator. Donut of each type’s share of `netWorth`; legend removed in favor of colored % on the asset columns.

2b. **YoY same-month compare** — last card in `DashboardTop` (above the era navigator). Selected month vs same `MM` one year earlier (lookup by `yearMonth`). Three-column layout: large month names as column headers; metric labels (תזרים / הכנסות / הוצאות / שווי נקי) centered with ₪ Δ and % change under each; amounts flanking each label. No footer summary line. Empty state if prior year missing.

2g. **Era navigator** — centered `‹ תקופת חיים ›` (`EraNavigator`, same chrome as month nav). Cycles **כל התקופות** / each era label from config (default **כל התקופות**). Owned by `DashboardClient`; scopes **period gain/loss** + every chart that used to have its own era dropdown (net worth, income vs expenses, expense-type history, cashflow). Expense/asset **pies live in `DashboardTop`** and follow the month navigator (not the era navigator). Per-card `EraSelect` dropdowns are removed.

3. **Period gain/loss** — interactive card: **period** dropdown only (**3 / 6 / 12 חודשים / הכל**, default **6**); era comes from §7.2g. Headline = net-worth change over the trailing window within the selected era scope (`latest − startOfWindow`), signed + colored, with %. Sub-row: sum of cashflow, total income, total expenses in that window. If fewer months exist than requested, uses all available and notes it.

4. **Net worth over time** — dual view with toggle **מגמה / הרכב** (`NetWorthChart`):
   - **מגמה** (default): area chart of total NW. **No left (Y) axis** — values via tooltip only.
   - **הרכב**: stacked bar chart — each month’s bar height ≈ NW, segments = asset ₪ **> 0 only** (negatives / zeros omitted; stable colors by asset id, ordered by total positive ₪ in the window). Tooltip shows ₪ + % of that month’s NW for non-zero segments. Compact color legend under the chart.
   - Shared **timeframe** dropdown (era from §7.2g): **הכל** / **12 חודשים** / calendar years (newest first). Default timeframe **הכל**.

5. **Income vs. Expenses over time** — two lines (green income, red expenses). **No left (Y) axis** — values via tooltip only. Timeframe dropdown only (era from §7.2g); default timeframe **12 חודשים**.

6. **Expense type history** — expense-type + timeframe dropdowns (era from §7.2g). Bar chart of that type’s monthly ₪ over the selected window. When an era is selected, the type list is that era’s `expenseLineItems` only; when **כל התקופות**, current-era types first then extras. Header shows **סה״כ** for the selected type × timeframe (sum of bars), plus **count of months with non-zero** and **first–last active month** labels within that window. Months that don’t include that type are skipped. Defaults: type = first current-era `expenseLineItems` entry, timeframe **12 חודשים**.

7. **Cash flow over time** — bar chart, per month; positive/negative colored. Timeframe dropdown only (era from §7.2g); default timeframe **12 חודשים**.

*(Asset allocation pie and expense breakdown pie are in the month-summary block §7.2d2 / §7.2e2 — not in the charts stack.)*

10. **Goals** — `GoalsCard` from `goals.config.ts` + `computeGoalProgress`. Each goal: label, ₪ target (fixed `target` **or** dynamic `expenseMonths` = sum of last N months' expenses), metric (`netWorth` or sum of `assetIds`), progress bar (indigo / green when complete), current/target, remaining. **Tap a goal row** to expand a history line chart (`GoalHistoryChart` via `goalHistorySeries`): full-timeline metric (NW or asset sum) with a coral dashed **target ReferenceLine**. Default goals (top→bottom): **האפס החדש** (עו״ש → ₪5,000), **קרן חירום** (`expenseMonths: 6` vs עו״ש + קרן כספית), **יעד תיק השקעות** (תיק IB → ₪100,000), **אבן דרך · 250 אלף** (NW). Edit in config only (never written to the sheet). Uses **newest** timeline month for progress (not month navigator); chart uses full history.

11. **FIRE snapshot** — `FireCard` via `computeFireSnapshot`: שנות מחייה = latest NW ÷ (avg monthly expenses × 12 over trailing ≤12 months with expenses), plus 4% annual withdrawal (`NW × 0.04`). Shows NW + estimated annual expenses; notes thin history when fewer than 3 expense months.

12. **Year summary** — annual report card (`YearSummaryCard`) with year dropdown (newest first; current year labeled `YYYY עד כה`). Totals: income, expenses, cashflow sum, avg savings rate, NW start→end change + end NW, best/worst cashflow month in that year, top 5 expense categories by year total. Driven by full timeline (not month navigator). Helpers in `tierTwo.ts`.

13. **Era comparison** — just above insight cards (`EraComparisonCard`). Side‑by‑side columns per era present in the timeline (`computeEraComparison`): months counted, avg cashflow / savings rate / income / expenses, top 3 expense types by average monthly ₪. Footer hints when exactly two eras (cashflow Δ + savings-rate pair). Empty state if fewer than two eras. Placed after year summary, immediately above תובנות.

14. **Insight cards** — see §8.

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

**Typography:** Rubik/Heebo. Hero numbers **very large** (~48–60px), bold, colored by sign, with the `₪` symbol. Section labels small, gray, above the value. Hebrew everywhere; thousands separators; sign shown for changes (`+15,407` green / `−12,253`). Signs always sit on the **visual left** of digits (via LRM / custom formatters in `format.ts`) so RTL does not flip them to the trailing side.

**Cards:** white, rounded corners ~`20px`, soft subtle shadow, generous padding, single-column mobile stack.

**Combined hero card:** single white card split 50/50. Right (RTL start): cash-flow signature — personalized line → bold statement (e.g. "פברואר הסתיים בתזרים חיובי") → giant colored number → savings caption (**{pct}% מהכנסה נחסך החודש**, no sparkline) → flush income/expenses sub-stats (**סה"כ הכנסות** green `+`, **סה"כ הוצאות** `-`, no gap) under a hairline. Left: small **שווי נקי** + semibold **שווי כלל הנכסים החודש** (same sizes as right titles) → net worth big number → same hairline → MoM ₪/% change aligned with the income/expenses row. Vertical hairline between halves.

**Month-comparison bar chart:** titled like "החודש ביחס לחודשים אחרים". Clean, **no gridlines**, value labels above each bar, month abbreviations below, green bars for positive cash flow and coral for negative, thin zero baseline. This is the cash-flow-over-time chart from §7.

**Month navigator (required):** see §7.0 — lives in `DashboardTop` with Tier‑1 cards **and** the expense/asset pies (all follow the selected month). The lower history-chart stack and bottom insight grid stay on the **newest** month / full timeline for insights (not tied to the month navigator). Era scoping for charts/period card is §7.2g.

**RTL:** `dir="rtl"` on the root, right-aligned text, chart axes/legends oriented for Hebrew. Month and era navigators force `dir="ltr"` for chevron order only.

---

## 8. Insights (totals-only — no FIRE)

`computeInsights(timeline, atIndex?)` — `atIndex` defaults to last month. Heroes / Tier‑1 use the navigator index; the bottom insight grid uses the default (newest).

All computed from `MonthPoint[]`, nothing else:

| Insight | Formula |
|---|---|
| Current net worth | selected `netWorth` |
| Net worth MoM change | `selected.netWorth − prev.netWorth` (₪ and %) |
| Latest cash flow | selected `cashflow` |
| Avg monthly cash flow (last 12 mo) | mean of up to 12 `cashflow` ending at selection |
| Savings rate (latest) | `cashflow / income` as % (guard income = 0) |
| Avg savings rate (last 12 mo) | mean of monthly `cashflow/income` in that window |
| Best / worst cash-flow month | max / min `cashflow` over **full** timeline with its date |
| Total saved over full period | `selected.netWorth − first.netWorth` |
| Months tracked | count of `MonthPoint` |
| Positive cashflow streak | consecutive months ending at newest with `cashflow > 0` |
| High-savings streak | consecutive months ending at newest with savings rate ≥ 20% |

**Tier‑1 helpers** live in `src/lib/tierOne.ts` (anomalies, YoY, streaks, movers, needs/luxuries, savings-rate series).

**Tier‑2 helpers** live in `src/lib/tierTwo.ts` (allocation drift, era comparison, year summary).

Keep the bottom insight cards as a **2-column grid on all breakpoints** (including mobile). No projections, no withdrawal rates.

---

## 9. File structure (implemented)

```
/src
  /app
    /api/data/route.ts      # server: returns normalized MonthPoint[] as JSON (middleware-gated)
    actions.ts              # refreshFinanceData + loginWithPassword + logout server actions
    page.tsx                # site password gate (homepage) + link to mockup
    /dashboard/page.tsx     # finance dashboard (server component → client charts)
    /mockup/page.tsx        # public demo dashboard with random numbers (no Sheets)
    layout.tsx              # dir="rtl", Rubik, base styles
  middleware.ts             # cookie gate: protect /dashboard + /api/*; redirect unlocked / → /dashboard (/mockup is open)
  /components
    ChartContainer.tsx      # measured width + viewport fallback; ChartErrorBoundary
    ClientCharts.tsx        # client boundary for dynamic(..., { ssr: false })
    ChartsSection.tsx       # client-only charts wrapper
    TimeframeSelect.tsx     # per-chart timeframe dropdown (הכל / 12mo / years)
    DashboardClient.tsx     # client: global era + DashboardTop + period + charts + goals + FIRE + year summary + era compare + insights
    DashboardTop.tsx        # client: month index + heroes + expense/asset month pies + Tier‑1 cards
    MonthNavigator.tsx      # ‹ month › chevrons (ltr order)
    EraNavigator.tsx        # ‹ era › chevrons — scopes period card + era-aware charts
    GoalsCard.tsx           # wealth: progress meters; expand → GoalHistoryChart
    GoalHistoryChart.tsx    # wealth: line history + coral target ReferenceLine
    FireCard.tsx            # wealth: years of living + 4% withdrawal
    EraComparisonCard.tsx   # Tier‑2: side-by-side era averages + expense mix
    YearSummaryCard.tsx     # Tier‑2: annual report card with year picker
    HeroCards.tsx           # HeroSummary (cashflow + net worth + inline savings %)
    YoYCompareCard.tsx      # same-month last year
    TopMoversCard.tsx       # מה השתנה: expense movers + anomalies; AssetsMoversCard (+ embedded asset pie)
    NeedsLuxuriesCard.tsx   # needs vs luxuries + embedded expense pie + % detail list
    PeriodChangeCard.tsx    # made/lost over last N months (client; era from prop)
    NetWorthChart.tsx       # NW trend area + composition stacked bars (מגמה/הרכב toggle)
    AllocationPieCard.tsx   # shared donut (+ optional legend); supports embedded mode
    AssetAllocationChart.tsx # pie: selected-month assets (embedded in AssetsMoversCard)
    IncomeExpensesChart.tsx
    ExpenseBreakdownChart.tsx # pie: selected-month expenses (embedded in NeedsLuxuriesCard)
    ExpenseTypeHistoryChart.tsx # bar: selected expense type over time
    CashflowChart.tsx
    InsightCards.tsx        # §8 insight grid (includes streaks)
    RefreshButton.tsx
    DisconnectButton.tsx    # form → logout (clears site_access cookie → /)
    PasswordGateForm.tsx    # client form → loginWithPassword
  /lib
    types.ts                # MonthPoint + BreakdownItem (shared; safe for client imports)
    auth.ts                 # HMAC access token + timing-safe password check (site gate)
    mockTimeline.ts         # seeded fake MonthPoint[] for /mockup demos
    timeframe.ts            # filterByTimeframe (all / last12 / year) + options + resolveTimeframe
    eraFilter.ts            # filterByEra (all / eraId) + options from eras.config
    periodChange.ts         # trailing-window NW/cashflow totals for PeriodChangeCard
    expensePeriod.ts        # expense-pie month/year period options + aggregation
    sheets.ts               # googleapis auth + batchGet
    normalize.ts            # eras.config → MonthPoint[]
    data.ts                 # unstable_cache (5 min) + finance-data tag
    columns.ts              # colToIndex helper
    dates.ts                # DD.MM.YYYY parse + yearMonth
    insights.ts             # the §8 calculations (optional atIndex)
    tierOne.ts              # anomalies, YoY, streaks, movers, needs/luxuries, rate series
    tierTwo.ts              # allocation drift, era comparison, year summary
    wealth.ts               # goal progress + history series + FIRE snapshot
    format.ts               # ₪ / % / Hebrew month formatters (leading +/- via LRM in RTL)
  eras.config.ts            # THE config (owner fills column letters + expense kind)
  goals.config.ts           # wealth goals: targets + metric (netWorth / asset ids)
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
SITE_PASSWORD=<shared password for the homepage gate>
```

- Load the JSON from the env var and pass it to `google.auth.GoogleAuth({ credentials, scopes: [...] })`.
- `SITE_PASSWORD` unlocks `/` → sets httpOnly `site_access` cookie (HMAC of the password); middleware verifies it before `/dashboard` and `/api/*`. Dashboard **התנתקות** clears the cookie and returns to `/`.
- **Mockup / demo:** `/mockup` is **not** password-gated. The gate page links to it. `buildMockTimeline()` invents ~36 months across both eras using `eras.config` labels; numbers reshuffle on each page load. Real sheet data is never loaded on this route — safe for showing the UI to others.
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

**H. Fill `.env.local`** with the ID, the JSON key, and `SITE_PASSWORD` (§10), then run `npm run dev`. Visit `/`, enter the password, and you should land on `/dashboard`.

**I. Tune wealth goals** (`goals.config.ts`)
Edit fixed `target` ₪ amounts, or use `expenseMonths` for a dynamic target (sum of last N months' expenses — e.g. קרן חירום = 6). Emergency fund uses `metric: "assets"` + `assetIds` (checking + money_market). NW milestones use `metric: "netWorth"`. No sheet changes needed.

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
- [ ] **Env vars** — `GOOGLE_SPREADSHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_KEY` + `SITE_PASSWORD` in `.env.local` (§11 A–E, G–H).
- [x] ~~**Site password gate**~~ — `/` gate + `/dashboard` + middleware cookie protection (set `SITE_PASSWORD`).
- [x] ~~**Mockup dashboard**~~ — `/mockup` with random numbers + gate-page link (no Sheets / no real money data).

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
