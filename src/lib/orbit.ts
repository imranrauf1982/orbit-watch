import * as satellite from "satellite.js";

export type LiveState = {
  lat: number; // degrees
  lon: number; // degrees
  altitudeKm: number;
  velocityKmS: number;
};

const EARTH_RADIUS_KM = 6371;

/**
 * Given a parsed satrec and a point in time, returns geodetic position
 * (lat/lon/altitude) plus orbital speed. Returns null if propagation fails
 * (can happen for decayed or malformed elements).
 */
export function propagate(
  satrec: satellite.SatRec,
  date: Date
): LiveState | null {
  const pv = satellite.propagate(satrec, date);
  if (!pv || typeof pv.position === "boolean" || typeof pv.velocity === "boolean") {
    return null;
  }
  const gmst = satellite.gstime(date);
  const geodetic = satellite.eciToGeodetic(pv.position, gmst);

  const lat = satellite.degreesLat(geodetic.latitude);
  const lon = satellite.degreesLong(geodetic.longitude);
  const altitudeKm = geodetic.height;

  const { x: vx, y: vy, z: vz } = pv.velocity;
  const velocityKmS = Math.sqrt(vx * vx + vy * vy + vz * vz);

  return { lat, lon, altitudeKm, velocityKmS };
}

/**
 * Converts geodetic lat/lon/altitude into a 3D cartesian point on a unit-radius
 * globe (scene units), so the rendered globe can be any visual radius.
 * sceneRadius should match the Earth mesh radius used in the scene.
 */
export function geodeticToVector3(
  lat: number,
  lon: number,
  altitudeKm: number,
  sceneRadius: number
): [number, number, number] {
  const totalRadiusKm = EARTH_RADIUS_KM + altitudeKm;
  const scale = sceneRadius / EARTH_RADIUS_KM;
  const r = totalRadiusKm * scale;

  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  // +90 deg offset aligns texture seam with standard equirectangular maps
  const x = r * Math.cos(latRad) * Math.cos(lonRad + Math.PI / 2);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad + Math.PI / 2);

  return [x, y, z];
}
