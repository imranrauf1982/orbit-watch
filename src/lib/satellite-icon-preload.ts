import * as THREE from "three";
import { SATELLITE_CATALOG } from "./satellite-catalog";

/**
 * Every real icon slug the app can possibly ask for: the curated per-
 * satellite photos, plus the three category fallbacks used for anything
 * outside that curated list (see genericImageSlug in satellite-catalog.ts).
 * Small, fixed, known ahead of time — cheap to warm up all at once.
 */
const KNOWN_SLUGS: string[] = [
  ...new Set([
    ...SATELLITE_CATALOG.map((c) => c.imageSlug).filter((s): s is string => !!s),
    "iss", // generic "station" fallback
    "starlink", // generic "constellation" fallback
    "terra", // generic default fallback
  ]),
];

let preloaded = false;

/**
 * Fires off a load for every known satellite icon so the browser's HTTP
 * cache (and three.js's own THREE.Cache, enabled here) already has them by
 * the time any individual SatelliteMarker asks for its own texture.
 *
 * Why this exists: SatelliteMarker loads its icon with its own
 * `THREE.TextureLoader` on mount, which is asynchronous — for roughly the
 * first frame or two (previously reported as "about half a second," which
 * lines up with a cold network fetch) it had nothing to show yet and fell
 * back to rendering the cartoon procedural model, then swapped to the real
 * photo once it arrived. That swap is what read as "shows the wrong
 * cartoon icon first." Warming every known icon once, up front, means each
 * marker's own load call resolves against an already-cached image almost
 * immediately instead of waiting on a fresh network round trip.
 *
 * Safe to call multiple times or from multiple components — only does real
 * work once per page load.
 */
export function preloadSatelliteIcons() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  THREE.Cache.enabled = true;
  const loader = new THREE.TextureLoader();
  for (const slug of KNOWN_SLUGS) {
    loader.load(`/satellites/${slug}.png`, undefined, undefined, () => {
      /* 404 or decode failure for a slug — harmless, individual markers
         still fall back to the procedural model for that one. */
    });
  }
}
