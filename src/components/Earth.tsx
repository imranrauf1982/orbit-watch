"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { subsolarPoint } from "@/lib/sun";

export const EARTH_RADIUS = 2.4;

const TERMINATOR_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TERMINATOR_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 sunDir;
  void main() {
    float lightAmount = dot(vNormal, sunDir);
    // soft band around the terminator, dark on the night side
    float night = smoothstep(0.12, -0.12, lightAmount);
    gl_FragColor = vec4(0.0, 0.01, 0.03, night * 0.55);
  }
`;

/** lat/lon (deg) -> unit direction vector, matching the app's toXYZ convention. */
function latLonToDirection(lat: number, lon: number): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lonRad + Math.PI / 2),
    Math.sin(latRad),
    Math.cos(latRad) * Math.sin(lonRad + Math.PI / 2)
  );
}

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

  const terminatorUniforms = useMemo(
    () => ({ sunDir: { value: new THREE.Vector3(1, 0, 0) } }),
    []
  );
  const lastSunUpdate = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01; // slow ambient drift
    }
    // Real subsolar point barely moves within a few seconds — recompute
    // occasionally rather than every frame to keep this cheap.
    const now = state.clock.getElapsedTime();
    if (now - lastSunUpdate.current > 5) {
      lastSunUpdate.current = now;
      const { lat, lon } = subsolarPoint(new Date());
      terminatorUniforms.sunDir.value.copy(latLonToDirection(lat, lon));
    }
  });

  return (
    <>
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

      {/* Day/night terminator — deliberately NOT a child of the rotating
          group, since it represents the real (non-rotating) sun direction */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[EARTH_RADIUS * 1.008, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={terminatorUniforms}
          vertexShader={TERMINATOR_VERTEX}
          fragmentShader={TERMINATOR_FRAGMENT}
        />
      </mesh>
    </>
  );
}
