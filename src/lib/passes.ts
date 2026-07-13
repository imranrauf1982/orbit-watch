import * as satellite from "satellite.js";
import { isEclipsed, solarElevationDeg } from "./sun";
import { lookAnglesFromEci } from "./topocentric";

export type PassPrediction = {
  startTime: Date;
  maxElevationTime: Date;
  endTime: Date;
  maxElevationDeg: number;
  startAzimuthDeg: number;
  maxAzimuthDeg: number;
  endAzimuthDeg: number;
  durationSec: number;
  /** Satellite is sunlit AND the observer's sky is dark enough to see it. */
  visible: boolean;
};

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function azimuthToCompass(azDeg: number): string {
  return COMPASS[Math.round(((azDeg % 360) + 360) % 360 / 22.5) % 16];
}

type Options = {
  days?: number;
  stepSec?: number;
  minElevationDeg?: number;
};

/**
 * Scans forward from now and returns every pass where the satellite rises
 * above the horizon, flagging which ones are actually visible to the naked
 * eye (satellite lit by the sun, observer sky dark).
 */
export function computePasses(
  satrec: satellite.SatRec,
  observerLatDeg: number,
  observerLonDeg: number,
  opts: Options = {}
): PassPrediction[] {
  const days = opts.days ?? 3;
  const stepSec = opts.stepSec ?? 20;
  const minElevationDeg = opts.minElevationDeg ?? 0;

  const passes: PassPrediction[] = [];
  const totalSteps = Math.floor((days * 86400) / stepSec);
  const startMs = Date.now();

  let current: {
    startTime: Date;
    startAzimuthDeg: number;
    maxElevationDeg: number;
    maxElevationTime: Date;
    maxAzimuthDeg: number;
    endTime: Date;
    endAzimuthDeg: number;
    anyVisible: boolean;
  } | null = null;

  for (let i = 0; i <= totalSteps; i++) {
    const date = new Date(startMs + i * stepSec * 1000);
    const pv = satellite.propagate(satrec, date);
    if (!pv || typeof pv.position === "boolean") continue;

    const gmst = satellite.gstime(date);
    const look = lookAnglesFromEci(pv.position, gmst, observerLatDeg, observerLonDeg);
    const elevationDeg = look.elevationDeg;
    const azimuthDeg = look.azimuthDeg;

    if (elevationDeg > minElevationDeg) {
      if (!current) {
        current = {
          startTime: date,
          startAzimuthDeg: azimuthDeg,
          maxElevationDeg: elevationDeg,
          maxElevationTime: date,
          maxAzimuthDeg: azimuthDeg,
          endTime: date,
          endAzimuthDeg: azimuthDeg,
          anyVisible: false,
        };
      }
      if (elevationDeg > current.maxElevationDeg) {
        current.maxElevationDeg = elevationDeg;
        current.maxElevationTime = date;
        current.maxAzimuthDeg = azimuthDeg;
      }
      current.endTime = date;
      current.endAzimuthDeg = azimuthDeg;

      const eclipsed = isEclipsed(pv.position, date);
      const sunElev = solarElevationDeg(observerLatDeg, observerLonDeg, date);
      if (!eclipsed && sunElev < -6) current.anyVisible = true;
    } else if (current) {
      const durationSec = (current.endTime.getTime() - current.startTime.getTime()) / 1000;
      if (durationSec >= 60) {
        passes.push({
          startTime: current.startTime,
          maxElevationTime: current.maxElevationTime,
          endTime: current.endTime,
          maxElevationDeg: current.maxElevationDeg,
          startAzimuthDeg: current.startAzimuthDeg,
          maxAzimuthDeg: current.maxAzimuthDeg,
          endAzimuthDeg: current.endAzimuthDeg,
          durationSec,
          visible: current.anyVisible,
        });
      }
      current = null;
    }
  }

  return passes.slice(0, 25);
}
