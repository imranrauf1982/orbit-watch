"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { EARTH_RADIUS, latLonToDirection } from "./Earth";

type CountryLabel = {
  name: string;
  iso: string | null;
  lat: number;
  lon: number;
  rank: number; // relative population rank from Natural Earth (higher = bigger country)
};

// Camera-distance -> "how many countries to label" curve. Keeps the globe
// readable when zoomed out (only the biggest/most recognizable countries
// shown) and reveals the rest smoothly as the person zooms in, rather than
// dumping all ~177 names on screen at once. Distances are the same
// "scene units from Earth's center" OrbitControls/CameraFocus use — see
// MAX_CAMERA_DISTANCE / minDistance in CameraFocus.tsx and Scene.tsx.
const ZOOM_CURVE: { distance: number; count: number }[] = [
  { distance: 14, count: 14 }, // fully zoomed out — a handful of the largest countries
  { distance: 9, count: 40 },
  { distance: 6, count: 90 },
  { distance: 3, count: 177 }, // fully zoomed in — every country in the dataset
];

function countForDistance(distance: number): number {
  const clamped = Math.min(ZOOM_CURVE[0].distance, Math.max(ZOOM_CURVE[ZOOM_CURVE.length - 1].distance, distance));
  for (let i = 0; i < ZOOM_CURVE.length - 1; i++) {
    const a = ZOOM_CURVE[i];
    const b = ZOOM_CURVE[i + 1];
    if (clamped <= a.distance && clamped >= b.distance) {
      const t = (a.distance - clamped) / (a.distance - b.distance);
      return Math.round(a.count + (b.count - a.count) * t);
    }
  }
  return ZOOM_CURVE[ZOOM_CURVE.length - 1].count;
}

/**
 * Tracks camera distance from Earth's center and reports back how many
 * country labels should currently be visible, rounded to the nearest 5 so
 * the label set doesn't reshuffle every single frame (that would thrash
 * <Html> mount/unmount and hurt perf for no visible benefit).
 */
function useVisibleCount(): number {
  const { camera } = useThree();
  const [count, setCount] = useState(40);
  const lastRef = useRef(40);

  useFrame(() => {
    const raw = countForDistance(camera.position.length());
    const rounded = Math.round(raw / 5) * 5;
    if (rounded !== lastRef.current) {
      lastRef.current = rounded;
      setCount(rounded);
    }
  });

  return count;
}

/**
 * Country name labels pinned to the globe surface, positioned with the same
 * lat/lon -> direction math the Earth texture, satellite ground-tracks, and
 * ContinentLabels all use — so a label always sits over the correct real
 * country no matter how the globe is rotated, zoomed, or spun by the sim
 * clock. This is what lets someone glance at the globe (including mid-pass,
 * while "Fly With Satellite" is chasing a satellite across the map) and see
 * which country's airspace is currently underneath it.
 *
 * Label count scales with zoom (see ZOOM_CURVE) so the globe stays legible
 * fully zoomed out instead of showing all ~177 names at once, and
 * <Html occlude> hides any label currently on the far side of the globe.
 */
export default function CountryLabels({ dim = false }: { dim?: boolean }) {
  const [countries, setCountries] = useState<CountryLabel[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/country_labels.json")
      .then((res) => res.json())
      .then((data: CountryLabel[]) => {
        if (!cancelled) setCountries(data);
      })
      .catch(() => {
        // Offline / fetch failure: fail quietly and just skip country
        // labels for this session — continent labels still orient the
        // user, and nothing else on the globe depends on this data.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Precompute each label's 3D position once (they never move relative to
  // the globe — WorldSpin in Scene.tsx rotates this whole layer already),
  // sorted by rank so slicing to `visibleCount` always keeps the biggest,
  // most recognizable countries on screen first.
  const points = useMemo(() => {
    if (!countries) return [];
    return [...countries]
      .sort((a, b) => b.rank - a.rank)
      .map((c) => ({
        ...c,
        position: latLonToDirection(c.lat, c.lon)
          .multiplyScalar(EARTH_RADIUS * 1.008)
          .toArray() as [number, number, number],
      }));
  }, [countries]);

  const visibleCount = useVisibleCount();
  const visible = points.slice(0, visibleCount);

  if (!countries) return null;

  return (
    <>
      {visible.map((p) => (
        <Html
          key={p.iso ?? p.name}
          position={p.position}
          center
          occlude
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="whitespace-nowrap select-none"
            style={{
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "rgba(235, 245, 255, 0.85)",
              opacity: dim ? 0.45 : 0.8,
              textShadow: "0 0 4px rgba(0,0,0,0.95), 0 0 1px rgba(0,0,0,0.9)",
            }}
          >
            {p.name}
          </span>
        </Html>
      ))}
    </>
  );
}
