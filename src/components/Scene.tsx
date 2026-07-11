"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import Earth from "./Earth";
import SatelliteMarker from "./SatelliteMarker";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import { SATELLITE_CATALOG } from "@/lib/satellite-catalog";

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  onSelect: (id: number, state: LiveState | null) => void;
};

export default function Scene({ satellites, selectedId, onSelect }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]} // capped device-pixel-ratio keeps mobile GPUs happy
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!touch-none"
    >
      <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={45} />
      <color attach="background" args={["#05070D"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} />

      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={2500} factor={2} saturation={0} fade speed={0.4} />
        <Earth />
        {satellites.map((sat) => {
          const entry = SATELLITE_CATALOG.find((c) => c.id === sat.id);
          if (!entry) return null;
          return (
            <SatelliteMarker
              key={sat.id}
              entry={entry}
              line1={sat.line1}
              line2={sat.line2}
              isSelected={selectedId === sat.id}
              onSelect={onSelect}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={14}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}
