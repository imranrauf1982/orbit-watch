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
