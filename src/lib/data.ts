import "server-only";

import { unstable_cache } from "next/cache";
import { getTimeline, type TimelineResult } from "@/lib/normalize";

export const FINANCE_CACHE_TAG = "finance-data";

export const getCachedTimeline = unstable_cache(
  async (): Promise<TimelineResult> => getTimeline(),
  ["finance-timeline"],
  {
    tags: [FINANCE_CACHE_TAG],
    revalidate: 300, // 5 minutes — sheet updates ~monthly
  },
);
