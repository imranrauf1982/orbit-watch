import { NextResponse } from "next/server";
import { fetchBulkTle } from "@/lib/fetch-tle";

// Serves the full CelesTrak "active satellites" catalog for the client's
// lazy, non-Featured fetch (see OrbitWatchApp.tsx). fetchBulkTle() already
// handles CelesTrak's own hourly caching + one retry-without-cache on a
// failed/empty response, so this route just calls it and forwards the
// result as JSON.
//
// Cache-Control here is for the browser/CDN layer on top of that: a short
// public max-age plus a longer stale-while-revalidate window means repeat
// visitors get an instant response from cache while a fresh copy is fetched
// in the background, rather than blocking on CelesTrak every time.
export async function GET() {
  const satellites = await fetchBulkTle();

  return NextResponse.json(
    { satellites },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3300",
      },
    }
  );
}
