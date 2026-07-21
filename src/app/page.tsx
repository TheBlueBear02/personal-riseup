import Link from "next/link";
import { PasswordGateForm } from "@/components/PasswordGateForm";

export default function GatePage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          הכספים שלי
        </h1>
        <p className="mt-2 text-sm text-text-secondary">כניסה עם סיסמה</p>
      </div>
      <PasswordGateForm />
      <div className="relative text-center">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/8" />
        <span className="relative bg-page px-3 text-xs text-text-secondary">
          או
        </span>
      </div>
      <Link
        href="/mockup"
        className="rounded-[16px] border border-black/8 bg-card px-4 py-3 text-center text-base font-medium text-text-primary transition hover:border-green/40 hover:bg-green/5"
      >
        תצוגת דמו
        <span className="mt-1 block text-sm font-normal text-text-secondary">
          לוח בקרה עם מספרים אקראיים
        </span>
      </Link>
    </main>
  );
}
