"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { FINANCE_CACHE_TAG } from "@/lib/data";

export async function refreshFinanceData(): Promise<void> {
  // Expire immediately so the next render fetches fresh sheet data
  revalidateTag(FINANCE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}
