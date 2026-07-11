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
