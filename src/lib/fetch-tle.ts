import { SATELLITE_CATALOG } from "@/lib/satellite-catalog";

export type TleResult = {
  id: number;
  name: string;
  line1: string;
  line2: string;
};

async function fetchOne(id: number): Promise<TleResult | null> {
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

export async function fetchAllTle(): Promise<TleResult[]> {
  const results = await Promise.all(
    SATELLITE_CATALOG.map((entry) => fetchOne(entry.id))
  );
  return results.filter((r): r is TleResult => r !== null);
}
