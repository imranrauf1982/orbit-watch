import * as satellite from "satellite.js";
import { propagate } from "./orbit";
import { getLookAngles } from "./topocentric";

export type WhereAmIResult = {
  /** Straight-line distance from the observer to the satellite right now. */
  distanceKm: number;
  /** Satellite's current altitude above Earth's surface. */
  altitudeKm: number;
  /** Nearest point (in range) the satellite comes to the observer within
   * the scan horizon — may be "right now" if it's already approaching its
   * closest point, or up to a few hours out. Null if propagation failed. */
  closestApproach: { time: Date; distanceKm: number } | null;
};

/**
 * Powers the "Where Am I?" quick action: how far away is the selected
 * satellite from the observer right now, and when does it come closest?
 * Reuses the same look-angle math the passes/sky-dome features already
 * depend on (lib/topocentric.ts) — no new orbital math here.
 */
export function computeWhereAmI(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  opts: { horizonHours?: number; stepSec?: number } = {}
): WhereAmIResult | null {
  const now = new Date();
  const nowState = propagate(satrec, now);
  const nowLook = getLookAngles(satrec, observerLatDeg, observerLonDeg, now);
  if (!nowState || !nowLook) return null;

  const horizonHours = opts.horizonHours ?? 6;
  const stepSec = opts.stepSec ?? 30;
  const steps = Math.floor((horizonHours * 3600) / stepSec);

  let best: { time: Date; distanceKm: number } | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = new Date(now.getTime() + i * stepSec * 1000);
    const look = getLookAngles(satrec, observerLatDeg, observerLonDeg, t);
    if (!look) continue;
    if (!best || look.rangeKm < best.distanceKm) {
      best = { time: t, distanceKm: look.rangeKm };
    }
  }

  return {
    distanceKm: nowLook.rangeKm,
    altitudeKm: nowState.altitudeKm,
    closestApproach: best,
  };
}
