export type CatalogEntry = {
  id: number; // NORAD catalog number
  name: string;
  category: "station" | "telescope" | "constellation" | "weather" | "science";
  // Optional: filename (no extension) of a real photo in /public/satellites/.
  // If present and /public/satellites/<imageSlug>.png loads successfully,
  // the 3D marker renders as that photo instead of the procedural model.
  imageSlug?: string;
};

// A hand-picked set of recognizable, actively tracked objects.
// Kept small on purpose: fast to fetch, fast to render, no dead weight.
export const SATELLITE_CATALOG: CatalogEntry[] = [
  { id: 25544, name: "ISS (ZARYA)", category: "station", imageSlug: "iss" },
  { id: 20580, name: "Hubble Space Telescope", category: "telescope", imageSlug: "hubble" },
  { id: 48274, name: "Tiangong (CSS)", category: "station", imageSlug: "tiangong" },
  { id: 43013, name: "NOAA-20", category: "weather", imageSlug: "noaa-20" },
  { id: 33591, name: "NOAA-19", category: "weather", imageSlug: "noaa-19" },
  { id: 25994, name: "Terra", category: "science", imageSlug: "terra" },
  { id: 27424, name: "Aqua", category: "science", imageSlug: "aqua" },
  { id: 39084, name: "Landsat 8", category: "science", imageSlug: "landsat-8" },
  { id: 49260, name: "Landsat 9", category: "science", imageSlug: "landsat-9" },
  { id: 44713, name: "Starlink-1007", category: "constellation", imageSlug: "starlink" },
  { id: 43600, name: "Iridium NEXT 106", category: "constellation", imageSlug: "iridium" },
  { id: 41765, name: "GOES-16", category: "weather", imageSlug: "goes-16" },
  { id: 43226, name: "GOES-17", category: "weather", imageSlug: "goes-17" },
  { id: 25338, name: "NOAA-15", category: "weather", imageSlug: "noaa-15" },
  { id: 28654, name: "NOAA-18", category: "weather", imageSlug: "noaa-18" },
  { id: 37849, name: "Suomi NPP", category: "science", imageSlug: "suomi-npp" },
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

/**
 * Fallback photo slug for any satellite that isn't in the curated 16 (i.e.
 * anything selected from the mass point cloud or search). We obviously
 * can't have a unique photo per satellite for a 14,000-object catalog, but
 * a real, category-appropriate photo still beats the cartoon fallback.
 *
 * These used to point at "generic-station"/"generic-constellation"/
 * "generic-satellite" — files that were never actually added to
 * /public/satellites/. Every satellite outside the curated 16 (e.g.
 * OneWeb, random Starlinks selected from search) silently 404'd on that
 * nonexistent file and fell back to the cartoon procedural model. Pointing
 * these at photos that actually ship in that folder fixes it — an
 * ISS-style photo for stations, a Starlink-style flat-panel photo for
 * constellation objects, and a generic science-bus photo (Terra) for
 * everything else is a closer visual match than the cartoon fallback, even
 * when it isn't the exact satellite.
 */
export function genericImageSlug(category: CatalogEntry["category"]): string {
  if (category === "station") return "iss";
  if (category === "constellation") return "starlink";
  return "terra";
}

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
