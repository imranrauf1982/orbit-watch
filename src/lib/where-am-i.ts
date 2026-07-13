import * as satellite from "satellite.js";
import { propagate } from "./orbit";
import { getLookAngles } from "./topocentric";

export type WhereAmINow = {
  /** Straight-line distance from the observer to the satellite right now. */
  distanceKm: number;
  /** Satellite's current altitude above Earth's surface. */
  altitudeKm: number;
};

export type WhereAmIResult = WhereAmINow & {
  /** Nearest point (in range) the satellite comes to the observer within
   * the scan horizon — may be "right now" if it's already approaching its
   * closest point, or up to a few hours out. Null if propagation failed. */
  closestApproach: { time: Date; distanceKm: number } | null;
};

/**
 * Cheap "where is it relative to me, right now" — one propagation + one
 * look-angle calculation. Safe to call every second for a live-updating
 * card without any noticeable cost.
 */
export function computeWhereAmINow(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  at: Date = new Date()
): WhereAmINow | null {
  const nowState = propagate(satrec, at);
  const nowLook = getLookAngles(satrec, observerLatDeg, observerLonDeg, at);
  if (!nowState || !nowLook) return null;
  return { distanceKm: nowLook.rangeKm, altitudeKm: nowState.altitudeKm };
}

/**
 * The more expensive part: scans forward across the horizon window to find
 * the closest approach. Fine to call occasionally (e.g. every 15-30s) but
 * not worth doing on every 1s UI tick.
 */
export function computeClosestApproach(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  opts: { horizonHours?: number; stepSec?: number } = {}
): { time: Date; distanceKm: number } | null {
  const now = new Date();
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
  return best;
}

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
  const now = computeWhereAmINow(satrec, observerLatDeg, observerLonDeg);
  if (!now) return null;
  const closestApproach = computeClosestApproach(satrec, observerLatDeg, observerLonDeg, opts);
  return { ...now, closestApproach };
}
