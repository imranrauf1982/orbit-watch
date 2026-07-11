import OrbitWatchApp from "@/components/OrbitWatchApp";
import { fetchAllTle } from "@/lib/fetch-tle";

export const revalidate = 3600;

export default async function Page() {
  const satellites = await fetchAllTle();
  return <OrbitWatchApp satellites={satellites} />;
}
