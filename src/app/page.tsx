import OrbitWatchApp from "@/components/OrbitWatchApp";
import { fetchBulkTle } from "@/lib/fetch-tle";

export const revalidate = 3600;

export default async function Page() {
  // One bulk request for every actively tracked object (Phase 1). The
  // featured/curated subset used to be its own fetch loop — it's now just a
  // filter over this same array, so no extra round trips.
  const satellites = await fetchBulkTle();
  return <OrbitWatchApp satellites={satellites} />;
}
