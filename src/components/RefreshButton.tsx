"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refreshFinanceData } from "@/app/actions";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await refreshFinanceData();
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-2 rounded-full bg-indigo px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
    >
      <span aria-hidden className={pending ? "animate-spin" : ""}>
        ↻
      </span>
      {pending ? "מרענן…" : "רענון"}
    </button>
  );
}
