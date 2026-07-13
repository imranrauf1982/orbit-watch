"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { EARTH_RADIUS, latLonToDirection } from "./Earth";

type ContinentLabel = {
  name: string;
  lat: number;
  lon: number;
};

// Approximate visual centroids — good enough for "which part of the world
// is this" orientation, not meant to be cartographically precise.
const CONTINENTS: ContinentLabel[] = [
  { name: "NORTH AMERICA", lat: 45, lon: -100 },
  { name: "SOUTH AMERICA", lat: -16, lon: -60 },
  { name: "EUROPE", lat: 52, lon: 15 },
  { name: "AFRICA", lat: 2, lon: 21 },
  { name: "ASIA", lat: 42, lon: 90 },
  { name: "OCEANIA", lat: -24, lon: 135 },
  { name: "ANTARCTICA", lat: -82, lon: 0 },
];

/**
 * Static continent name labels pinned to the globe surface. Positioned with
 * the same lat/lon -> direction math the Earth texture and satellite
 * ground-tracks use (see Earth.tsx / lib/orbit.ts), so they always sit over
 * the correct real-world continent — including during "Fly With Satellite",
 * where the camera pulls back far enough that raw geography alone is hard
 * to read at a glance.
 */
export default function ContinentLabels({ dim = false }: { dim?: boolean }) {
  const points = useMemo(
    () =>
      CONTINENTS.map((c) => ({
        ...c,
        position: latLonToDirection(c.lat, c.lon)
          .multiplyScalar(EARTH_RADIUS * 1.01)
          .toArray() as [number, number, number],
      })),
    []
  );

  return (
    <>
      {points.map((p) => (
        <Html
          key={p.name}
          position={p.position}
          center
          occlude
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="font-mono uppercase tracking-[0.15em] whitespace-nowrap select-none"
            style={{
              fontSize: "11px",
              color: "#EAF6FF",
              opacity: dim ? 0.55 : 0.85,
              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
            }}
          >
            {p.name}
          </span>
        </Html>
      ))}
    </>
  );
}
