"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import { propagate } from "@/lib/orbit";
import { bulkObjectColor } from "@/lib/satellite-catalog";
import { EARTH_RADIUS } from "./Earth";
import { useSatelliteCloud } from "@/lib/use-satellite-cloud";
import * as satellite from "satellite.js";

type Props = {
  satellites: TleResult[]; // the mass set — featured/selected already excluded by caller
  onSelect: (id: number, state: LiveState | null) => void;
};

const DUMMY = new THREE.Object3D();
const COLOR = new THREE.Color();

/**
 * Renders thousands of satellites as a single InstancedMesh — one draw call
 * regardless of count (Phase 2). Positions come from a Web Worker doing the
 * bulk SGP4 propagation off the main thread, batched every ~1.5s rather than
 * every animation frame. Detailed procedural models stay reserved for the
 * featured/selected set (SatelliteMarker), matching the spec.
 */
export default function SatelliteCloud({ satellites, onSelect }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const snapshot = useSatelliteCloud(satellites, EARTH_RADIUS);

  const byId = useMemo(() => new Map(satellites.map((s) => [s.id, s])), [satellites]);
  const count = satellites.length;

  // Assign per-instance color once (grouping doesn't change frame to frame).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    satellites.forEach((sat, i) => {
      COLOR.set(bulkObjectColor(sat.name, sat.id));
      mesh.setColorAt(i, COLOR);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [satellites]);

  // Push new positions into the instance matrices whenever the worker
  // delivers a fresh batch (every ~1.5s, not every frame).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !snapshot) return;

    for (let i = 0; i < snapshot.ids.length && i < count; i++) {
      const x = snapshot.positions[i * 3];
      const y = snapshot.positions[i * 3 + 1];
      const z = snapshot.positions[i * 3 + 2];
      // A worker result of exactly the origin means propagation failed for
      // that object this tick — park it far away instead of at Earth's core.
      if (x === 0 && y === 0 && z === 0) {
        DUMMY.position.set(9999, 9999, 9999);
      } else {
        DUMMY.position.set(x, y, z);
      }
      DUMMY.scale.setScalar(1);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [snapshot, count]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const instanceId: number | undefined = e.instanceId;
    if (instanceId === undefined || !snapshot) return;
    const id = snapshot.ids[instanceId];
    const sat = byId.get(id);
    if (!sat) return;
    try {
      const rec = satellite.twoline2satrec(sat.line1, sat.line2);
      const state = propagate(rec, new Date());
      onSelect(id, state);
    } catch {
      onSelect(id, null);
    }
  };

  if (count === 0) return null;

  return (
    <instancedMesh
      key={count} // re-mount when the filtered set size changes so unused instances don't linger
      ref={meshRef}
      args={[undefined, undefined, count]}
      onClick={handleClick}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.018, 5, 5]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
