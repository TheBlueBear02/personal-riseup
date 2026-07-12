# Personal Finance Dashboard (Riseup-style MVP)

Private Hebrew RTL web app that reads a personal Google Sheets file (net worth + monthly cash flow) and visualizes it with graphs and lightweight insights.

Spec: [`agents/MVP.md`](agents/MVP.md)

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Recharts
- Google Sheets API via `googleapis` (service account, read-only)

## Setup

### 1. Install

```bash
npm install
```

### 2. Google Cloud (owner steps)

Follow **§11** in [`agents/MVP.md`](agents/MVP.md):

1. Create a Google Cloud project and enable the **Sheets API**
2. Create a service account + JSON key
3. Share the spreadsheet with the service account email (**Viewer**)
4. Copy the spreadsheet ID from the URL (`/d/SPREADSHEET_ID/edit`)

### 3. Environment

Copy `.env.local.example` → `.env.local`:

```
GOOGLE_SPREADSHEET_ID=<id>
GOOGLE_SERVICE_ACCOUNT_KEY=<full service-account JSON as one line>
```

### 4. Column letters

Open `src/eras.config.ts` and replace every `"TODO"` with the real column letter from the sheet **Name Box** (top-left). Do this for both eras (four tabs). Trust the Name Box — the sheet is RTL.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Until env vars and column letters are filled, the dashboard shows a setup banner instead of failing hard.

## Architecture

```
Google Sheets
  → src/lib/sheets.ts        (batchGet, UNFORMATTED_VALUE)
  → src/lib/normalize.ts     (eras.config → MonthPoint[])
  → src/lib/data.ts          (unstable_cache, 5 min + tag)
  → page.tsx / api/data      (dashboard + JSON)
```

Adding a future era = append one object to `ERAS` in `src/eras.config.ts`. No other code changes.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
