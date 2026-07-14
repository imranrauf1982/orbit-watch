"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { EARTH_RADIUS } from "./Earth";
import { getSimTime } from "@/lib/sim-clock";
import { getEarthSpinAngle, applyEarthSpin } from "@/lib/earth-spin";
import { DEFAULT_CAMERA_POSITION } from "./CameraFocus";

type Props = {
  active: boolean;
  satelliteId: number | null;
  satellites: { id: number; line1: string; line2: string }[];
  controlsRef: React.RefObject<any>;
};

// Scene units out from the satellite, along the outward-from-Earth vector.
// Real LEO satellites sit barely above the surface at this globe's scale
// (EARTH_RADIUS = 2.4, orbit altitude adds only ~0.1-0.2 units) — chasing
// from just 0.9 units away put the camera almost touching the surface, so
// all you could see was an extreme close-up of texture with no sense of
// the globe or which continent was below. Pulled back to roughly the
// planet's own radius, the whole curved horizon and nearby continents stay
// in frame while still clearly "riding along" with the satellite.
const CHASE_DISTANCE = 2.6;
const FOLLOW_LERP = 0.08; // smoothing factor — lower = smoother/slower catch-up
// How much of the look-at target is pulled toward Earth's center (vs. the
// satellite itself). 0 = stare straight at the satellite (old behavior,
// mostly empty space); 1 = stare straight down at the globe. A blend keeps
// the satellite marker in the upper part of the frame while the globe and
// its geography fill the rest, like a real chase/orbit cam.
const NADIR_BLEND = 0.55;

/**
 * "Fly With Satellite" chase cam. While active, continuously repositions
 * the camera a short distance from the selected satellite (in its
 * outward-from-Earth direction) and keeps it in frame, so it reads as
 * riding along in orbit. The parent <Scene> disables OrbitControls (and
 * widens its min/max distance) while this is active so the two don't fight
 * over the camera transform; this component resets the camera to the
 * globe's normal default view on exit (see DEFAULT_CAMERA_POSITION in
 * CameraFocus.tsx), so leaving Fly Mode reliably lands back at the normal
 * zoom level rather than wherever the camera happened to be beforehand.
 */
export default function FlyCam({ active, satelliteId, satellites, controlsRef }: Props) {
  const { camera } = useThree();
  const wasActive = useRef(false);

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

  // Resets to the globe's normal default view on exit — not a snapshot of
  // wherever the camera happened to be right before flying. A snapshot
  // sounds more "faithful," but if the camera was already zoomed in from
  // an earlier action (e.g. a prior selection focus) before Fly Mode
  // started, restoring that snapshot would leave the view zoomed in too,
  // which is exactly the "stuck zoomed in after leaving the feature" bug
  // this replaces. Always landing on the same known-good default is what
  // actually reads as "back to normal."
  useEffect(() => {
    if (active) {
      wasActive.current = true;
      return;
    }
    if (!wasActive.current) return; // never actually flew — nothing to reset
    wasActive.current = false;
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target?.set(0, 0, 0);
    controlsRef.current?.update?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useFrame(() => {
    if (!active || !satrec) return;
    const simTime = getSimTime();
    const state = propagate(satrec, simTime);
    if (!state) return;

    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    // The satellite itself renders inside <WorldSpin>, which rotates the
    // whole globe+satellites assembly at Earth's real sidereal rate (see
    // lib/earth-spin.ts). This camera lives outside that group, in plain
    // world space, so it has to apply the same rotation to know where the
    // satellite actually is right now — otherwise the chase cam would
    // steadily fall behind (or race ahead of) the globe's own spin.
    const satPos = applyEarthSpin(new THREE.Vector3(x, y, z), getEarthSpinAngle(simTime));
    const outward = satPos.clone().normalize();
    const chasePos = satPos.clone().add(outward.clone().multiplyScalar(CHASE_DISTANCE));

    // Look at a point between the satellite and Earth's center, rather than
    // straight at the tiny satellite model — that's what actually puts the
    // globe (and the continents scrolling underneath) in view.
    const lookTarget = satPos.clone().lerp(new THREE.Vector3(0, 0, 0), NADIR_BLEND);

    camera.position.lerp(chasePos, FOLLOW_LERP);
    camera.lookAt(lookTarget);

    if (controlsRef.current) {
      controlsRef.current.target.copy(lookTarget);
      controlsRef.current.update?.();
    }
  });

  return null;
}
