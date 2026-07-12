export type CatalogEntry = {
  id: number; // NORAD catalog number
  name: string;
  category: "station" | "telescope" | "constellation" | "weather" | "science";
};

// A hand-picked set of recognizable, actively tracked objects.
// Kept small on purpose: fast to fetch, fast to render, no dead weight.
export const SATELLITE_CATALOG: CatalogEntry[] = [
  { id: 25544, name: "ISS (ZARYA)", category: "station" },
  { id: 20580, name: "Hubble Space Telescope", category: "telescope" },
  { id: 48274, name: "Tiangong (CSS)", category: "station" },
  { id: 43013, name: "NOAA-20", category: "weather" },
  { id: 33591, name: "NOAA-19", category: "weather" },
  { id: 25994, name: "Terra", category: "science" },
  { id: 27424, name: "Aqua", category: "science" },
  { id: 39084, name: "Landsat 8", category: "science" },
  { id: 49260, name: "Landsat 9", category: "science" },
  { id: 44713, name: "Starlink-1007", category: "constellation" },
  { id: 43600, name: "Iridium NEXT 106", category: "constellation" },
  { id: 41765, name: "GOES-16", category: "weather" },
  { id: 43226, name: "GOES-17", category: "weather" },
  { id: 25338, name: "NOAA-15", category: "weather" },
  { id: 28654, name: "NOAA-18", category: "weather" },
  { id: 37849, name: "Suomi NPP", category: "science" },
];

// Entries fall out silently if Celestrak has no current TLE for the ID
// (decayed object, etc.) — fetchAllTle() filters those, so it's safe to
// keep this list a little generous.

export const CATEGORY_LABEL: Record<CatalogEntry["category"], string> = {
  station: "Space Station",
  telescope: "Telescope",
  constellation: "Constellation",
  weather: "Weather",
  science: "Earth Science",
};

export const CATEGORY_COLOR: Record<CatalogEntry["category"], string> = {
  station: "#FF6A3D",
  telescope: "#4FD8EB",
  constellation: "#8A93A6",
  weather: "#FFB84D",
  science: "#7CE38B",
};

// A fast lookup Set of the featured/curated NORAD IDs — used everywhere we
// need to split "detailed model" satellites from the "mass point cloud".
export const FEATURED_IDS: ReadonlySet<number> = new Set(
  SATELLITE_CATALOG.map((c) => c.id)
);

/**
 * Filter groups for the full bulk catalog (thousands of objects fetched from
 * CelesTrak's `GROUP=active` set). These are cheap name-pattern heuristics —
 * CelesTrak doesn't tag category in the trimmed TLE payload, so we bucket by
 * name. Good enough for filtering what's rendered; not meant to be precise
 * taxonomy.
 */
export type FilterGroup = "featured" | "starlink" | "stations" | "all";

export const FILTER_GROUP_LABEL: Record<FilterGroup, string> = {
  featured: "Featured",
  starlink: "Starlink",
  stations: "Space Stations",
  all: "All Active",
};

const STATION_NAME_PATTERN = /\b(ISS|ZARYA|TIANGONG|CSS|MIR)\b/i;

export function bulkObjectGroup(name: string, id: number): "starlink" | "station" | "other" {
  if (FEATURED_IDS.has(id) && STATION_NAME_PATTERN.test(name)) return "station";
  if (/^STARLINK/i.test(name)) return "starlink";
  if (STATION_NAME_PATTERN.test(name)) return "station";
  return "other";
}

/** Deterministic color for a "mass" (non-featured) satellite point, bucketed
 * by the same rough grouping used for filters, so Starlink trains read as a
 * cluster and everything else reads as a neutral dust of dots. */
export function bulkObjectColor(name: string, id: number): string {
  const group = bulkObjectGroup(name, id);
  if (group === "starlink") return "#8A93A6";
  if (group === "station") return "#FF6A3D";
  return "#4FD8EB";
}
