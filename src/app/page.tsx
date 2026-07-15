import { RefreshButton } from "@/components/RefreshButton";
import { HeroCashflow, HeroNetWorth } from "@/components/HeroCards";
import { ClientCharts } from "@/components/ClientCharts";
import { PeriodChangeCard } from "@/components/PeriodChangeCard";
import { InsightCards } from "@/components/InsightCards";
import { getCachedTimeline } from "@/lib/data";
import { computeInsights } from "@/lib/insights";

function SetupBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-yellow/40 bg-yellow/15 p-5 text-sm leading-relaxed text-text-primary">
      <p className="font-semibold">האפליקציה מוכנה — נשאר להשלים הגדרה</p>
      <p className="mt-2 text-text-secondary">{message}</p>
      <ol className="mt-3 list-decimal space-y-1 pr-5 text-text-secondary">
        <li>צרו Service Account ושתפו איתו את הגיליון (Viewer)</li>
        <li>מלאו `.env.local` לפי `.env.local.example`</li>
        <li>מלאו את אותיות העמודות ב־`src/eras.config.ts` (Name Box בגיליון)</li>
        <li>הריצו מחדש `npm run dev`</li>
      </ol>
    </div>
  );
}

export default async function Home() {
  const result = await getCachedTimeline();

  if (!result.ok) {
    return (
      <main className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-4 px-4 py-8 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-indigo">הכספים שלי</p>
            <h1 className="text-2xl font-bold text-text-primary">לוח בקרה</h1>
          </div>
          <RefreshButton />
        </header>
        <SetupBanner message={result.message} />
      </main>
    );
  }

  const timeline = result.data;
  const insights = computeInsights(timeline);

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-4 px-4 py-8 sm:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-indigo">הכספים שלי</p>
          <h1 className="text-2xl font-bold text-text-primary">לוח בקרה</h1>
        </div>
        <RefreshButton />
      </header>

      <HeroCashflow insights={insights} />
      <HeroNetWorth insights={insights} />
      <PeriodChangeCard data={timeline} />
      <ClientCharts data={timeline} />
      <InsightCards insights={insights} />

      <footer className="pb-8 pt-2 text-center text-xs text-text-secondary">
        נתונים מקובץ Google Sheets · קריאה בלבד
      </footer>
    </main>
  );
}
