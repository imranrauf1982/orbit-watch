import * as satellite from "satellite.js";

export type LookAngles = {
  azimuthDeg: number;
  elevationDeg: number;
  rangeKm: number;
};

/**
 * Azimuth/elevation/range from an observer's lat/lon to a satellite, given
 * its already-propagated ECI position and the GMST for that same instant.
 * Lower-level variant — used by passes.ts, which has already called
 * satellite.propagate() once per step and shouldn't pay for a second one.
 */
export function lookAnglesFromEci(
  eciPosition: satellite.EciVec3<number>,
  gmst: number,
  observerLatDeg: number,
  observerLonDeg: number
): LookAngles {
  const posEcf = satellite.eciToEcf(eciPosition, gmst);
  const observerGd = {
    latitude: satellite.degreesToRadians(observerLatDeg),
    longitude: satellite.degreesToRadians(observerLonDeg),
    height: 0.05,
  };
  const look = satellite.ecfToLookAngles(observerGd, posEcf);

  return {
    azimuthDeg: look.azimuth * (180 / Math.PI),
    elevationDeg: look.elevation * (180 / Math.PI),
    rangeKm: look.rangeSat,
  };
}

/**
 * Convenience variant for standalone callers (e.g. the Sky Dome view) that
 * haven't already propagated the satellite for this instant — propagates
 * it internally. Returns null if propagation fails (decayed/malformed
 * elements), same failure contract as lib/orbit.ts's propagate().
 */
export function getLookAngles(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): LookAngles | null {
  const pv = satellite.propagate(satrec, date);
  if (!pv || typeof pv.position === "boolean") return null;
  const gmst = satellite.gstime(date);
  return lookAnglesFromEci(pv.position, gmst, observerLatDeg, observerLonDeg);
}
