import Link from "next/link";
import { DashboardClient } from "@/components/DashboardClient";
import { buildMockTimeline } from "@/lib/mockTimeline";
import { computeInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default function MockupPage() {
  const timeline = buildMockTimeline();
  const insights = computeInsights(timeline);

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-4 px-4 py-8 sm:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-indigo">הכספים שלי</p>
          <h1 className="text-2xl font-bold text-text-primary">לוח בקרה</h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-black/8 bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-green/40 hover:text-text-primary"
        >
          חזרה
        </Link>
      </header>

      <div
        className="rounded-[16px] border border-indigo/25 bg-indigo/10 px-4 py-3 text-sm text-text-primary"
        role="status"
      >
        <p className="font-semibold text-indigo">תצוגת דמו</p>
        <p className="mt-1 text-text-secondary">
          המספרים אקראיים ואינם משקפים נתונים אמיתיים. רענון הדף מייצר סדרה חדשה.
        </p>
      </div>

      <DashboardClient data={timeline} insights={insights} />

      <footer className="pb-8 pt-2 text-center text-xs text-text-secondary">
        תצוגת דמו · ללא חיבור ל־Google Sheets
      </footer>
    </main>
  );
}
