"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const EARTH_RADIUS = 2.4;

/** Builds a wireframe graticule (lines of latitude & longitude) as a LineSegments geometry. */
function buildGraticule(radius: number, step = 15) {
  const points: number[] = [];
  const segs = 64;

  // Meridians (longitude lines)
  for (let lon = -180; lon < 180; lon += step) {
    for (let i = 0; i < segs; i++) {
      const lat1 = -90 + (180 * i) / segs;
      const lat2 = -90 + (180 * (i + 1)) / segs;
      points.push(...toXYZ(lat1, lon, radius));
      points.push(...toXYZ(lat2, lon, radius));
    }
  }
  // Parallels (latitude lines)
  for (let lat = -75; lat <= 75; lat += step) {
    for (let i = 0; i < segs; i++) {
      const lon1 = -180 + (360 * i) / segs;
      const lon2 = -180 + (360 * (i + 1)) / segs;
      points.push(...toXYZ(lat, lon1, radius));
      points.push(...toXYZ(lat, lon2, radius));
    }
  }
  return new Float32Array(points);
}

function toXYZ(lat: number, lon: number, r: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const x = r * Math.cos(latRad) * Math.cos(lonRad + Math.PI / 2);
  const y = r * Math.sin(latRad);
  const z = r * Math.cos(latRad) * Math.sin(lonRad + Math.PI / 2);
  return [x, y, z];
}

export default function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const graticule = useMemo(() => buildGraticule(EARTH_RADIUS + 0.005), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01; // slow ambient drift
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#0B1220"
          emissive="#0A1A2E"
          emissiveIntensity={0.4}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Graticule grid */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[graticule, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4FD8EB" transparent opacity={0.18} />
      </lineSegments>

      {/* Atmosphere rim glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.035, 48, 48]} />
        <meshBasicMaterial
          color="#4FD8EB"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
