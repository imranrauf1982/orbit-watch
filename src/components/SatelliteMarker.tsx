"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
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
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  const [hovered, setHovered] = useState(false);
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

  useFrame(() => {
    const state = propagate(satrec, new Date());
    if (!state || !meshRef.current) return;
    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    meshRef.current.position.set(x, y, z);
    if (isSelected) {
      onSelect(entry.id, state);
    }
  });

  return (
    <group>
      <line ref={trailRef as any}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </line>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          const state = propagate(satrec, new Date());
          onSelect(entry.id, state);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[isSelected || hovered ? 0.05 : 0.032, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
