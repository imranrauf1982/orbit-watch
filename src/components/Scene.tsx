"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera, Stats } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Earth from "./Earth";
import SatelliteMarker from "./SatelliteMarker";
import SatelliteCloud from "./SatelliteCloud";
import CameraFocus from "./CameraFocus";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import {
  SATELLITE_CATALOG,
  FEATURED_IDS,
  bulkObjectGroup,
  type FilterGroup,
} from "@/lib/satellite-catalog";

type Props = {
  satellites: TleResult[]; // full filtered set for this view (featured ∪ mass)
  selectedId: number | null;
  onSelect: (id: number, state: LiveState | null) => void;
  filter: FilterGroup;
  showDots: boolean;
  showOrbitPaths?: boolean;
};

export default function Scene({
  satellites,
  selectedId,
  onSelect,
  filter,
  showDots,
  showOrbitPaths = false,
}: Props) {
  const controlsRef = useRef<any>(null);

  // Perf overlay (stats-gl style FPS/MS/MB panel) — free, dev-only, opt-in
  // via ?debug=1 so it never shows for regular visitors.
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  // Detailed procedural models: the curated catalog, plus whatever's
  // currently selected (so a mass-cloud pick "upgrades" to a real model).
  const detailed = useMemo(
    () =>
      satellites.filter(
        (s) => FEATURED_IDS.has(s.id) || s.id === selectedId
      ),
    [satellites, selectedId]
  );

  // Everything else renders as an instanced point cloud (Phase 2).
  const mass = useMemo(() => {
    const detailedIds = new Set(detailed.map((s) => s.id));
    return satellites.filter((s) => {
      if (detailedIds.has(s.id)) return false;
      if (filter === "starlink") return bulkObjectGroup(s.name, s.id) === "starlink";
      if (filter === "stations") return bulkObjectGroup(s.name, s.id) === "station";
      return true; // "all" and "featured" both fall back to whatever's left after detailed filtering
    });
  }, [satellites, detailed, filter]);

  return (
    <Canvas
      dpr={[1, 1.75]} // capped device-pixel-ratio keeps mobile GPUs happy
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!touch-none"
    >
      <PerspectiveCamera makeDefault fov={45} />
      <color attach="background" args={["#05070D"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 3, 5]} intensity={1.3} />
      <directionalLight position={[-6, -2, -4]} intensity={0.18} color="#4FD8EB" />

      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={2500} factor={2} saturation={0} fade speed={0.4} />
        <Earth />
        {detailed.map((sat) => {
          const entry =
            SATELLITE_CATALOG.find((c) => c.id === sat.id) ?? {
              id: sat.id,
              name: sat.name,
              category:
                bulkObjectGroup(sat.name, sat.id) === "station"
                  ? ("station" as const)
                  : bulkObjectGroup(sat.name, sat.id) === "starlink"
                  ? ("constellation" as const)
                  : ("science" as const),
            };
          return (
            <SatelliteMarker
              key={sat.id}
              entry={entry}
              line1={sat.line1}
              line2={sat.line2}
              isSelected={selectedId === sat.id}
              onSelect={onSelect}
              showOrbitPath={showOrbitPaths && (selectedId === sat.id || FEATURED_IDS.has(sat.id))}
            />
          );
        })}
        {filter !== "featured" && showDots && <SatelliteCloud satellites={mass} onSelect={onSelect} />}
      </Suspense>

      {debug && <Stats className="!left-auto !right-2 !top-2" />}

      {/* Swings the camera to face whatever gets selected, from any source
          (list, search, map, clicking a dot on the far side of the globe). */}
      <CameraFocus selectedId={selectedId} satellites={satellites} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={3.2}
        maxDistance={14}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}

