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
