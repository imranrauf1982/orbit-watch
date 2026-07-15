export type GeocodeResult = {
  displayName: string;
  lat: number;
  lon: number;
};

/**
 * Free-text place search (city, zip, landmark) using OpenStreetMap's public
 * Nominatim API — no API key, no cost. Runs entirely client-side; nothing
 * about the search is sent anywhere except the query text itself to OSM.
 */
export async function searchPlace(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
    trimmed
  )}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim's usage policy asks for an identifiable client; the Accept
      // header keeps responses to JSON only.
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];

  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

/**
 * Reverse geocode: given a lat/lon (e.g. a satellite's ground subpoint),
 * returns the nearest city/country label. Used to answer "what city is
 * this satellite over right now" rather than just showing raw coordinates.
 * Returns null for open ocean/polar/unpopulated points where Nominatim has
 * no address to give.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: {
      error?: string;
      display_name?: string;
      address?: Record<string, string>;
    } = await res.json();
    if (data.error) return null;

    const addr = data.address ?? {};
    const place = addr.city || addr.town || addr.village || addr.county || addr.state;
    const country = addr.country;
    if (place && country) return `${place}, ${country}`;
    if (place) return place;
    if (country) return country;
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
