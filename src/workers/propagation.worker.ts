/// <reference lib="webworker" />

// Bulk SGP4 propagation, off the main thread (Phase 2). This worker owns a
// cache of parsed satrecs and, on each "tick" message, propagates all of
// them and posts back a single Float32Array of packed [x, y, z, x, y, z...]
// scene-space positions (transferred, not copied) plus the id order so the
// main thread can map results back to satellites for click selection.
//
// Kept dependency-free (no @react-three/fiber, no DOM) so it only needs
// `satellite.js`, which is pure JS/WASM-free math and safe to run in a
// worker.

import * as satellite from "satellite.js";

const EARTH_RADIUS_KM = 6371;

type InitMessage = {
  type: "init";
  sceneRadius: number;
  satellites: { id: number; line1: string; line2: string }[];
};

type TickMessage = {
  type: "tick";
  time: number; // epoch ms
};

type WorkerInMessage = InitMessage | TickMessage;

type ReadyMessage = { type: "ready"; count: number; ids: number[] };
type PositionsMessage = { type: "positions"; positions: Float32Array; time: number };

let satrecs: { id: number; rec: satellite.SatRec }[] = [];
let sceneRadius = 2.4;

function geodeticToVector3(
  lat: number,
  lon: number,
  altitudeKm: number,
  radius: number
): [number, number, number] {
  const totalRadiusKm = EARTH_RADIUS_KM + altitudeKm;
  const scale = radius / EARTH_RADIUS_KM;
  const r = totalRadiusKm * scale;

  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const x = r * Math.cos(latRad) * Math.cos(lonRad);
  const y = r * Math.sin(latRad);
  const z = -r * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    sceneRadius = msg.sceneRadius;
    satrecs = [];
    for (const sat of msg.satellites) {
      try {
        const rec = satellite.twoline2satrec(sat.line1, sat.line2);
        satrecs.push({ id: sat.id, rec });
      } catch {
        // skip malformed elements
      }
    }
    const ready: ReadyMessage = {
      type: "ready",
      count: satrecs.length,
      ids: satrecs.map((s) => s.id),
    };
    (self as unknown as Worker).postMessage(ready);
    return;
  }

  if (msg.type === "tick") {
    const date = new Date(msg.time);
    const gmst = satellite.gstime(date);
    const positions = new Float32Array(satrecs.length * 3);

    for (let i = 0; i < satrecs.length; i++) {
      const pv = satellite.propagate(satrecs[i].rec, date);
      if (!pv || typeof pv.position === "boolean") {
        // Leave as [0,0,0] — main thread hides zero-length entries.
        continue;
      }
      const geodetic = satellite.eciToGeodetic(pv.position, gmst);
      const lat = satellite.degreesLat(geodetic.latitude);
      const lon = satellite.degreesLong(geodetic.longitude);
      const [x, y, z] = geodeticToVector3(lat, lon, geodetic.height, sceneRadius);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const out: PositionsMessage = { type: "positions", positions, time: msg.time };
    (self as unknown as Worker).postMessage(out, [positions.buffer]);
  }
};

export {};
