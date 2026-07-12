import { NextResponse } from "next/server";
import { getCachedTimeline } from "@/lib/data";

export const revalidate = 300;

export async function GET() {
  const result = await getCachedTimeline();

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: result.message },
      { status: result.reason === "fetch_error" ? 502 : 503 },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
