"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { EARTH_RADIUS } from "./Earth";
import { getSimTime } from "@/lib/sim-clock";

type Props = {
  satelliteId: number;
  satellites: { id: number; line1: string; line2: string }[];
  observerLat: number;
  observerLon: number;
};

/**
 * Temporary visual line drawn between the observer's location (on the
 * globe surface) and the currently tracked satellite — powers the "Where
 * Am I?" quick action. Purely presentational; the parent controls how long
 * it stays mounted (OrbitWatchApp clears it a few seconds after showing).
 */
export default function LocateLine({ satelliteId, satellites, observerLat, observerLon }: Props) {
  const lineRef = useRef<THREE.Line>(null);
  const positions = useRef(new Float32Array(6));

  const satrec = useMemo(() => {
    const sat = satellites.find((s) => s.id === satelliteId);
    if (!sat) return null;
    try {
      return satellite.twoline2satrec(sat.line1, sat.line2);
    } catch {
      return null;
    }
  }, [satelliteId, satellites]);

  const observerPos = useMemo(
    () => geodeticToVector3(observerLat, observerLon, 0, EARTH_RADIUS),
    [observerLat, observerLon]
  );

  // Geometry needs its position attribute created once, then updated in place.
  useEffect(() => {
    const geom = lineRef.current?.geometry as THREE.BufferGeometry | undefined;
    if (!geom) return;
    geom.setAttribute("position", new THREE.BufferAttribute(positions.current, 3));
  }, []);

  useFrame(() => {
    if (!satrec || !lineRef.current) return;
    const state = propagate(satrec, getSimTime());
    if (!state) return;
    const [sx, sy, sz] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);

    const arr = positions.current;
    arr[0] = observerPos[0];
    arr[1] = observerPos[1];
    arr[2] = observerPos[2];
    arr[3] = sx;
    arr[4] = sy;
    arr[5] = sz;

    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const attr = geom.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <group>
      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color="#FFB84D" transparent opacity={0.85} />
      </line>
      {/* Small marker pinning the observer's location on the globe */}
      <mesh position={observerPos as unknown as [number, number, number]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#FFB84D" />
      </mesh>
    </group>
  );
}
