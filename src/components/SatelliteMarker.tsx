"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { Html } from "@react-three/drei";
import { EARTH_RADIUS } from "./Earth";
import { geodeticToVector3, propagate, type LiveState } from "@/lib/orbit";
import type { CatalogEntry } from "@/lib/satellite-catalog";
import { CATEGORY_COLOR } from "@/lib/satellite-catalog";

type Props = {
  entry: CatalogEntry;
  line1: string;
  line2: string;
  isSelected: boolean;
  onSelect: (id: number, state: LiveState | null) => void;
};

export default function SatelliteMarker({ entry, line1, line2, isSelected, onSelect }: Props) {
  const satrec = useMemo(() => satellite.twoline2satrec(line1, line2), [line1, line2]);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const lastTelemetryPush = useRef(0);
  const color = CATEGORY_COLOR[entry.category];

  // Precompute a short trailing arc (~10 min behind) once per satrec; cheap and static-ish.
  const trailPositions = useMemo(() => {
    const pts: number[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 30 * 1000); // 30s steps, 10 min trail
      const s = propagate(satrec, t);
      if (!s) continue;
      const [x, y, z] = geodeticToVector3(s.lat, s.lon, s.altitudeKm, EARTH_RADIUS);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [satrec]);

  useFrame(({ clock }) => {
    const state = propagate(satrec, new Date());
    if (!state || !groupRef.current) return;
    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    groupRef.current.position.set(x, y, z);

    if (isSelected) {
      const now = clock.getElapsedTime();
      if (now - lastTelemetryPush.current > 0.5) {
        lastTelemetryPush.current = now;
        onSelect(entry.id, state);
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const state = propagate(satrec, new Date());
    onSelect(entry.id, state);
  };

  return (
    <group>
      {/* Trail sits at absolute world positions, independent of the moving group */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </line>

      <group ref={groupRef}>
        {/* Visible dot — kept small on purpose */}
        <mesh renderOrder={1}>
          <sphereGeometry args={[isSelected || hovered ? 0.055 : 0.032, 12, 12]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>

        {/* Invisible larger sphere = the actual click/tap target, much easier to hit */}
        <mesh
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Name label — screen-space, scales with distance, hides behind the globe */}
        <Html center distanceFactor={9} occlude="blending" style={{ pointerEvents: "none" }}>
          <div
            className="whitespace-nowrap font-mono select-none transition-opacity"
            style={{
              fontSize: isSelected || hovered ? "12px" : "9px",
              color,
              opacity: isSelected || hovered ? 1 : 0.75,
              textShadow: "0 0 4px #05070D, 0 0 8px #05070D",
              transform: "translateY(14px)",
              fontWeight: isSelected || hovered ? 600 : 400,
            }}
          >
            {entry.name}
          </div>
        </Html>
      </group>
    </group>
  );
}
