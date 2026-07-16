 import OrbitWatchApp from "@/components/OrbitWatchApp";
import { fetchFeaturedTle } from "@/lib/fetch-tle";
export const revalidate = 3600;
export default async function Page() {
  // Fast path: only the curated ~15-satellite set, fetched in parallel.
  // The full multi-thousand-object catalog is loaded lazily on the client
  // (see OrbitWatchApp) so first paint doesn't wait on it.
  const satellites = await fetchFeaturedTle();
  return <OrbitWatchApp initialSatellites={satellites} />;
}
