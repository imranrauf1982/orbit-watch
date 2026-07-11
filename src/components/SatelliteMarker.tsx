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

/** A small procedural satellite: body + solar panel wings + antenna — no
 * external model files needed, cheap to render dozens of at once. */
function SatelliteModel({ color, targetScale }: { color: string; targetScale: number }) {
  const spinRef = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.6;
    if (scaleRef.current) {
      const s = scaleRef.current.scale.x + (targetScale - scaleRef.current.scale.x) * Math.min(delta * 8, 1);
      scaleRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={scaleRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.05, 0.035, 0.035]} />
        <meshStandardMaterial color="#C7CEDB" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.03, 6]} />
        <meshStandardMaterial color="#8A93A6" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Solar panel wings, slowly rotating about the body's long axis */}
      <group ref={spinRef}>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.045]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[-0.09, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.045]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Beacon glow — brightens when selected via parent scale/emissive tweaks */}
      <mesh position={[0, 0.012, 0.02]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function SatelliteMarker({ entry, line1, line2, isSelected, onSelect }: Props) {
  const satrec = useMemo(() => satellite.twoline2satrec(line1, line2), [line1, line2]);
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Line>(null);
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

  const outward = useMemo(() => new THREE.Vector3(), []);
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const state = propagate(satrec, new Date());
    if (!state || !groupRef.current) return;
    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    groupRef.current.position.set(x, y, z);

    // Orient the model "standing up" pointing away from Earth's center —
    // reads as a satellite floating in orbit rather than a flat sticker.
    outward.set(x, y, z).normalize();
    quat.setFromUnitVectors(upAxis, outward);
    groupRef.current.quaternion.copy(quat);

    if (isSelected) {
      const now = clock.getElapsedTime();
      if (now - lastTelemetryPush.current > 0.5) {
        lastTelemetryPush.current = now;
        onSelect(entry.id, state);
      }
    }
  });

  const modelScale = isSelected ? 1.7 : hovered ? 1.35 : 1;

  return (
    <group>
      <line ref={trailRef as any}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </line>

      <group ref={groupRef}>
        {/* Invisible larger hit-target sphere makes the small model easy to click/tap */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            const state = propagate(satrec, new Date());
            onSelect(entry.id, state);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <SatelliteModel color={color} targetScale={modelScale} />

        {isSelected && (
          <mesh>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.12} />
          </mesh>
        )}
      </group>
    </group>
  );
}
