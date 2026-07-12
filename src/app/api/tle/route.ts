import { NextResponse } from "next/server";
import { fetchBulkTle } from "@/lib/fetch-tle";

export const revalidate = 3600; // TLEs are stable for hours; refresh hourly

export async function GET() {
  const satellites = await fetchBulkTle();

  return NextResponse.json(
    { satellites, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600" } }
  );
}
