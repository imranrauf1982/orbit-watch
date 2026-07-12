"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { EARTH_RADIUS } from "./Earth";

type Props = {
  selectedId: number | null;
  satellites: { id: number; line1: string; line2: string }[];
  controlsRef: React.RefObject<any>;
};

const DURATION_SEC = 0.9;

/**
 * When the selected satellite changes, smoothly rotates the camera around
 * Earth so the satellite ends up facing the viewer, instead of leaving it
 * wherever it happened to be (including the far side of the globe, out of
 * sight). Distance/zoom from Earth is preserved — only the viewing angle
 * changes. Runs once per selection change, not continuously, so the user
 * can freely rotate away afterward without being fought by the camera.
 */
export default function CameraFocus({ selectedId, satellites, controlsRef }: Props) {
  const { camera } = useThree();
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);

  const satrec = useMemo(() => {
    if (selectedId === null) return null;
    const sat = satellites.find((s) => s.id === selectedId);
    if (!sat) return null;
    try {
      return satellite.twoline2satrec(sat.line1, sat.line2);
    } catch {
      return null;
    }
  }, [selectedId, satellites]);

  useEffect(() => {
    if (!satrec) return;
    const state = propagate(satrec, new Date());
    if (!state) return;

    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    const direction = new THREE.Vector3(x, y, z).normalize();
    const distance = camera.position.length();

    anim.current = {
      from: camera.position.clone(),
      to: direction.multiplyScalar(distance),
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrec]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + delta / DURATION_SEC);
    const eased = 1 - Math.pow(1 - a.t, 3); // ease-out cubic
    camera.position.lerpVectors(a.from, a.to, eased);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update?.();
    if (a.t >= 1) anim.current = null;
  });

  return null;
}
