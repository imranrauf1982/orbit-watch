import * as satellite from "satellite.js";

const AU_KM = 149597870.7;
const EARTH_RADIUS_KM = 6371;
const DEG2RAD = Math.PI / 180;

type Vec3 = { x: number; y: number; z: number };

/**
 * Low-precision solar position in the ECI frame (Vallado's algorithm).
 * Accurate to within ~0.01 deg — plenty for pass visibility & terminator rendering.
 */
/** Julian date from a UTC Date (standard civil-calendar algorithm). */
function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function sunEci(date: Date): Vec3 {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;

  const lambdaMSun = (280.46 + 36000.771 * T) % 360;
  const mSun = ((357.5291092 + 35999.05034 * T) % 360) * DEG2RAD;
  const lambdaEcl =
    lambdaMSun + 1.914666471 * Math.sin(mSun) + 0.019994643 * Math.sin(2 * mSun);
  const rSunAU =
    1.000140612 - 0.016708617 * Math.cos(mSun) - 0.000139589 * Math.cos(2 * mSun);
  const eps = (23.439291 - 0.0130042 * T) * DEG2RAD;
  const rKm = rSunAU * AU_KM;
  const lambdaRad = lambdaEcl * DEG2RAD;

  return {
    x: rKm * Math.cos(lambdaRad),
    y: rKm * Math.cos(eps) * Math.sin(lambdaRad),
    z: rKm * Math.sin(eps) * Math.sin(lambdaRad),
  };
}

/** Geodetic point on Earth directly beneath the sun ("subsolar point"). */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const sun = sunEci(date);
  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(sun as unknown as satellite.EciVec3<number>, gmst);
  return {
    lat: satellite.degreesLat(geo.latitude),
    lon: satellite.degreesLong(geo.longitude),
  };
}

/** True if the satellite (ECI km) sits inside Earth's cylindrical shadow (no direct sunlight). */
export function isEclipsed(satEci: Vec3, date: Date): boolean {
  const sun = sunEci(date);
  const mag = Math.sqrt(sun.x * sun.x + sun.y * sun.y + sun.z * sun.z);
  const u = { x: sun.x / mag, y: sun.y / mag, z: sun.z / mag };
  const along = satEci.x * u.x + satEci.y * u.y + satEci.z * u.z;
  if (along > 0) return false; // on the sun-facing side
  const perp = {
    x: satEci.x - along * u.x,
    y: satEci.y - along * u.y,
    z: satEci.z - along * u.z,
  };
  const perpDist = Math.sqrt(perp.x * perp.x + perp.y * perp.y + perp.z * perp.z);
  return perpDist < EARTH_RADIUS_KM;
}

/** Approximate solar elevation (deg) at an observer's lat/lon at a given time. */
export function solarElevationDeg(observerLat: number, observerLon: number, date: Date): number {
  const { lat: subLat, lon: subLon } = subsolarPoint(date);
  const el = Math.asin(
    Math.sin(observerLat * DEG2RAD) * Math.sin(subLat * DEG2RAD) +
      Math.cos(observerLat * DEG2RAD) *
        Math.cos(subLat * DEG2RAD) *
        Math.cos((observerLon - subLon) * DEG2RAD)
  );
  return el / DEG2RAD;
}

export type SkyPalette = {
  /** Color at the zenith (top of the dome). */
  top: string;
  /** Color roughly halfway up the sky. */
  mid: string;
  /** Color right at the horizon. */
  horizon: string;
  /** 0 (invisible) → 1 (fully visible) opacity for the star field. */
  starsOpacity: number;
  /** Warm glow band hugging the horizon (sunrise/sunset), 0-1 opacity (as a string, ready for inline style). */
  glowOpacity: string;
  /** Rough plain-language description of the current sky state. */
  label: string;
  isDaylight: boolean;
};

function hexLerp(a: string, b: string, t: number): string {
  const clamp = Math.min(1, Math.max(0, t));
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 255, ag = (ah >> 8) & 255, ab = ah & 255;
  const br = (bh >> 16) & 255, bg = (bh >> 8) & 255, bb = bh & 255;
  const r = Math.round(ar + (br - ar) * clamp);
  const g = Math.round(ag + (bg - ag) * clamp);
  const bl = Math.round(ab + (bb - ab) * clamp);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/**
 * Maps solar elevation to a sky-dome color palette, smoothly interpolated
 * across the classic astronomical bands (night → astro/nautical/civil
 * twilight → sunrise/sunset → day). Used by the realistic sky view to
 * decide how dark/bright the dome should look right now.
 */
export function skyPaletteForElevation(sunElevDeg: number): SkyPalette {
  // Ordered stops from darkest to brightest.
  const NIGHT = { top: "#010308", mid: "#020614", horizon: "#050a1c" };
  const ASTRO = { top: "#040a1c", mid: "#0a1230", horizon: "#151a3a" };
  const NAUTICAL = { top: "#0b1230", mid: "#16204f", horizon: "#2c2f5e" };
  const CIVIL = { top: "#15224a", mid: "#3a3f78", horizon: "#a85a5a" };
  const SUNRISE = { top: "#2a4f8c", mid: "#7893c9", horizon: "#ffa15c" };
  const DAY = { top: "#1c6fd4", mid: "#4a97e6", horizon: "#cfeaff" };

  let stop: { top: string; mid: string; horizon: string };
  let t: number;
  let label: string;
  let starsOpacity: number;
  let glowOpacity: number;

  if (sunElevDeg <= -18) {
    stop = NIGHT; t = 0; label = "Night sky"; starsOpacity = 1; glowOpacity = 0;
  } else if (sunElevDeg <= -12) {
    t = (sunElevDeg + 18) / 6;
    stop = {
      top: hexLerp(NIGHT.top, ASTRO.top, t),
      mid: hexLerp(NIGHT.mid, ASTRO.mid, t),
      horizon: hexLerp(NIGHT.horizon, ASTRO.horizon, t),
    };
    label = "Astronomical twilight"; starsOpacity = 1 - t * 0.15; glowOpacity = t * 0.1;
  } else if (sunElevDeg <= -6) {
    t = (sunElevDeg + 12) / 6;
    stop = {
      top: hexLerp(ASTRO.top, NAUTICAL.top, t),
      mid: hexLerp(ASTRO.mid, NAUTICAL.mid, t),
      horizon: hexLerp(ASTRO.horizon, NAUTICAL.horizon, t),
    };
    label = "Nautical twilight"; starsOpacity = 0.85 - t * 0.25; glowOpacity = 0.1 + t * 0.2;
  } else if (sunElevDeg <= 0) {
    t = (sunElevDeg + 6) / 6;
    stop = {
      top: hexLerp(NAUTICAL.top, CIVIL.top, t),
      mid: hexLerp(NAUTICAL.mid, CIVIL.mid, t),
      horizon: hexLerp(NAUTICAL.horizon, CIVIL.horizon, t),
    };
    label = "Civil twilight"; starsOpacity = 0.6 - t * 0.5; glowOpacity = 0.3 + t * 0.35;
  } else if (sunElevDeg <= 6) {
    t = sunElevDeg / 6;
    stop = {
      top: hexLerp(CIVIL.top, SUNRISE.top, t),
      mid: hexLerp(CIVIL.mid, SUNRISE.mid, t),
      horizon: hexLerp(CIVIL.horizon, SUNRISE.horizon, t),
    };
    label = sunElevDeg > 0 ? "Sunrise / sunset light" : "Just before sunrise/sunset";
    starsOpacity = 0.1 - t * 0.1; glowOpacity = 0.65 - t * 0.15;
  } else if (sunElevDeg <= 20) {
    t = (sunElevDeg - 6) / 14;
    stop = {
      top: hexLerp(SUNRISE.top, DAY.top, t),
      mid: hexLerp(SUNRISE.mid, DAY.mid, t),
      horizon: hexLerp(SUNRISE.horizon, DAY.horizon, t),
    };
    label = "Daytime"; starsOpacity = 0; glowOpacity = 0.5 - t * 0.5;
  } else {
    stop = DAY; label = "Daytime"; starsOpacity = 0; glowOpacity = 0;
  }

  return {
    top: stop.top,
    mid: stop.mid,
    horizon: stop.horizon,
    starsOpacity: Math.min(1, Math.max(0, starsOpacity)),
    glowOpacity: Math.min(0.75, Math.max(0, glowOpacity)).toFixed(2),
    label,
    isDaylight: sunElevDeg > -6,
  };
}
