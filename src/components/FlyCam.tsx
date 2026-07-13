"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { EARTH_RADIUS } from "./Earth";
import { getSimTime } from "@/lib/sim-clock";

type Props = {
  active: boolean;
  satelliteId: number | null;
  satellites: { id: number; line1: string; line2: string }[];
  controlsRef: React.RefObject<any>;
};

const CHASE_DISTANCE = 0.9; // scene units out from the satellite, along the outward-from-Earth vector
const FOLLOW_LERP = 0.08; // smoothing factor — lower = smoother/slower catch-up

/**
 * "Fly With Satellite" chase cam. While active, continuously repositions
 * the camera a short distance from the selected satellite (in its
 * outward-from-Earth direction) and keeps it in frame, so it reads as
 * riding along in orbit. The parent <Scene> disables OrbitControls (and
 * widens its min/max distance) while this is active so the two don't fight
 * over the camera transform; this component restores the pre-flight camera
 * position on exit.
 */
export default function FlyCam({ active, satelliteId, satellites, controlsRef }: Props) {
  const { camera } = useThree();
  const restoreState = useRef<{ position: THREE.Vector3 } | null>(null);

  const satrec = useMemo(() => {
    if (!active || satelliteId === null) return null;
    const sat = satellites.find((s) => s.id === satelliteId);
    if (!sat) return null;
    try {
      return satellite.twoline2satrec(sat.line1, sat.line2);
    } catch {
      return null;
    }
  }, [active, satelliteId, satellites]);

  // Snapshot the camera on entering fly mode; restore it on exit so normal
  // view (OrbitControls' expected min/max distance framing) isn't left
  // sitting somewhere odd relative to Earth.
  useEffect(() => {
    if (active) {
      restoreState.current = { position: camera.position.clone() };
    } else if (restoreState.current) {
      camera.position.copy(restoreState.current.position);
      camera.lookAt(0, 0, 0);
      controlsRef.current?.target?.set(0, 0, 0);
      controlsRef.current?.update?.();
      restoreState.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useFrame(() => {
    if (!active || !satrec) return;
    const state = propagate(satrec, getSimTime());
    if (!state) return;

    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    const satPos = new THREE.Vector3(x, y, z);
    const outward = satPos.clone().normalize();
    const chasePos = satPos.clone().add(outward.multiplyScalar(CHASE_DISTANCE));

    camera.position.lerp(chasePos, FOLLOW_LERP);
    camera.lookAt(satPos);

    if (controlsRef.current) {
      controlsRef.current.target.copy(satPos);
      controlsRef.current.update?.();
    }
  });

  return null;
}
