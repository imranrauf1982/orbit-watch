import * as satellite from "satellite.js";
import { lookAnglesFromEci } from "./topocentric";

export type OverheadResult = {
  id: number;
  name: string;
  elevationDeg: number;
  distanceKm: number;
  altitudeKm: number;
  velocityKmS: number;
};

// Caps how many objects get scanned so this stays instant even when the
// "All Active" filter has loaded several thousand TLEs. A few thousand
// synchronous SGP4 propagations is still well under a second, so this is a
// generous ceiling rather than a real constraint for the curated set.
const MAX_SCAN = 4000;

/**
 * Powers the "What's Above Me?" quick action: scans the currently loaded
 * satellite list and returns whichever one sits highest in the observer's
 * sky right now (closest to the zenith = closest to directly overhead).
 * Returns null if nothing is currently above the horizon.
 */
export function findWhatsAboveMe(
  satellites: { id: number; name: string; line1: string; line2: string }[],
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date = new Date()
): OverheadResult | null {
  const gmst = satellite.gstime(date);
  const scanList = satellites.length > MAX_SCAN ? satellites.slice(0, MAX_SCAN) : satellites;

  let best: OverheadResult | null = null;

  for (const sat of scanList) {
    let satrec: satellite.SatRec;
    try {
      satrec = satellite.twoline2satrec(sat.line1, sat.line2);
    } catch {
      continue;
    }
    const pv = satellite.propagate(satrec, date);
    if (!pv || typeof pv.position === "boolean" || typeof pv.velocity === "boolean") continue;

    const look = lookAnglesFromEci(pv.position, gmst, observerLatDeg, observerLonDeg);
    if (look.elevationDeg <= 0) continue; // below the horizon — not "above me"
    if (best && look.elevationDeg <= best.elevationDeg) continue;

    const geodetic = satellite.eciToGeodetic(pv.position, gmst);
    const { x: vx, y: vy, z: vz } = pv.velocity;
    best = {
      id: sat.id,
      name: sat.name,
      elevationDeg: look.elevationDeg,
      distanceKm: look.rangeKm,
      altitudeKm: geodetic.height,
      velocityKmS: Math.sqrt(vx * vx + vy * vy + vz * vz),
    };
  }

  return best;
}
