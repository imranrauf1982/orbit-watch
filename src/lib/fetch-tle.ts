import { SATELLITE_CATALOG } from "@/lib/satellite-catalog";

export type TleResult = {
  id: number;
  name: string;
  line1: string;
  line2: string;
};

const BULK_URL =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";

/**
 * Parses CelesTrak's bulk 3-line-per-object TLE text format into trimmed
 * records — only the four fields we actually use (id/name/line1/line2).
 * We deliberately request FORMAT=tle (not FORMAT=json): CelesTrak's JSON
 * output is OMM (orbital mean elements), not raw TLE line pairs, which
 * would need re-encoding to feed satellite.js's twoline2satrec(). The plain
 * TLE text is also the most compact wire format CelesTrak offers, which
 * matters once we're pulling several thousand objects in one request.
 */
function parseBulkTle(text: string): TleResult[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: TleResult[] = [];

  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;

    // NORAD catalog number occupies columns 3-7 of line 1 (1-indexed).
    const id = Number.parseInt(line1.slice(2, 7), 10);
    if (!Number.isFinite(id)) continue;

    results.push({ id, name, line1, line2 });
  }

  return results;
}

async function fetchBulkOnce(useCache: boolean): Promise<TleResult[]> {
  const res = await fetch(BULK_URL, {
    // A real UA can't hurt against hosts that reject default/blank ones.
    headers: { "User-Agent": "orbit-watch (contact: support@orbitwatch.app)" },
    ...(useCache ? { next: { revalidate: 3600 } } : { cache: "no-store" as const }),
  });
  if (!res.ok) {
    throw new Error(`CelesTrak bulk fetch failed: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return parseBulkTle(text);
}

/**
 * Fetches CelesTrak's full "active" satellite group in a single request
 * (several thousand objects) and trims it down server-side before it ever
 * reaches the client. Cached for an hour via Next.js fetch revalidation —
 * CelesTrak is a free public service, so we don't want to hit it more than
 * necessary regardless of how many browser sessions are open.
 *
 * IMPORTANT: a failed or empty first attempt is retried once with
 * `cache: "no-store"`. Without this, a single transient CelesTrak hiccup
 * (rate limit, timeout, etc.) at exactly the wrong moment gets cached as an
 * empty result for the full revalidate window (up to an hour) — every
 * visitor in that window would see "0 objects" even after CelesTrak recovers.
 */
export async function fetchBulkTle(): Promise<TleResult[]> {
  try {
    const first = await fetchBulkOnce(true);
    if (first.length > 0) return first;
    console.error("CelesTrak bulk fetch returned 0 satellites, retrying without cache");
  } catch (err) {
    console.error("CelesTrak bulk fetch failed, retrying without cache:", err);
  }

  try {
    return await fetchBulkOnce(false);
  } catch (err) {
    console.error("CelesTrak bulk fetch retry also failed:", err);
    return [];
  }
}

/**
 * Back-compat helper: the featured/curated set only (same ~15 satellites
 * that used to be the entire catalog), sliced out of the bulk fetch instead
 * of doing one HTTP request per satellite. Falls back to a direct per-ID
 * request only for a featured object CelesTrak's bulk group happens to be
 * missing (e.g. temporarily excluded from GROUP=active) — this should be
 * rare, so it's fine for it to be slower than the bulk path.
 */
export async function fetchFeaturedTle(bulk?: TleResult[]): Promise<TleResult[]> {
  const all = bulk ?? (await fetchBulkTle());
  const byId = new Map(all.map((r) => [r.id, r]));
  const missing: number[] = [];
  const featured: TleResult[] = [];

  for (const entry of SATELLITE_CATALOG) {
    const hit = byId.get(entry.id);
    if (hit) featured.push(hit);
    else missing.push(entry.id);
  }

  if (missing.length > 0) {
    const backfilled = await Promise.all(missing.map(fetchOneById));
    for (const r of backfilled) if (r) featured.push(r);
  }

  return featured;
}

async function fetchOneById(id: number): Promise<TleResult | null> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n").map((l) => l.trim());
    if (lines.length < 3) return null;
    const [name, line1, line2] = lines;
    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) return null;
    return { id, name, line1, line2 };
  } catch {
    return null;
  }
}
