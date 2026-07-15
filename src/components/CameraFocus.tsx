"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { getSimTime } from "@/lib/sim-clock";
import { getEarthSpinAngle, applyEarthSpin } from "@/lib/earth-spin";
import { EARTH_RADIUS } from "./Earth";

type Props = {
  selectedId: number | null;
  satellites: { id: number; line1: string; line2: string }[];
  controlsRef: React.RefObject<any>;
};

const DURATION_SEC = 0.9;

// The globe's normal, default viewing position — same values the camera is
// set to once on mount below. Exported so other camera controllers (namely
// FlyCam, on exiting "Fly With Satellite") can return to this exact same
// default rather than duplicating the literal or guessing at it.
export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 2, 7);

// Keep in sync with the non-fly-mode `maxDistance` on <OrbitControls> in
// Scene.tsx. Used to clamp how far out we're willing to pull the camera to
// fit a high-altitude satellite in frame, so we never fight OrbitControls'
// own limit right after this animation finishes. Exported so LocateFocus
// (Scene.tsx) can share the exact same limit for the same reason.
export const MAX_CAMERA_DISTANCE = 14;

/**
 * When the selected satellite changes, smoothly rotates the camera around
 * Earth so the satellite ends up facing the viewer, instead of leaving it
 * wherever it happened to be (including the far side of the globe, out of
 * sight).
 *
 * Zoom distance is normally preserved — only the viewing angle changes —
 * but with one important exception: if the satellite is farther from
 * Earth's center than the camera's current distance (true for MEO/GEO
 * objects like GPS/Galileo/geostationary satellites once you're zoomed in
 * reasonably close), keeping the old distance would place the satellite
 * literally *behind* the camera along that same ray, off-frame no matter
 * which way it's facing — this is what made the "What's Above Me" locate
 * line appear to shoot off into nothing instead of pointing at anything
 * visible. In that case we zoom out just enough to fit the satellite (with
 * a little margin), clamped to the same max zoom OrbitControls allows.
 * Runs once per selection change, not continuously, so the user can freely
 * rotate/zoom away afterward without being fought by the camera.
 */
export default function CameraFocus({ selectedId, satellites, controlsRef }: Props) {
  const { camera } = useThree();
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);

  // Runs exactly once on mount. Previously this position was set via a JSX
  // prop on <PerspectiveCamera position={[0,2,7]} />, which React Three
  // Fiber re-applies on every re-render of <Scene> — including the ones
  // triggered every ~0.5s by the selected satellite's telemetry refresh.
  // That silently snapped the camera back to [0,2,7] shortly after any
  // "focus on selection" animation ran, which is why selecting a satellite
  // looked like it moved but never actually settled on facing it.
  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Was `new Date()` — wrong wall-clock time when the sim is paused or
    // sped up. The satellite (inside WorldSpin) is positioned using
    // getSimTime(); this must match or the camera aims at where the
    // satellite *was* rather than where it's actually rendered.
    const simTime = getSimTime();
    const state = propagate(satrec, simTime);
    if (!state) return;

    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    const rotated = applyEarthSpin(new THREE.Vector3(x, y, z), getEarthSpinAngle(simTime));
    // Distance of the satellite itself from Earth's center, in scene units
    // — needed *before* normalizing `rotated` into a pure direction.
    const satRadius = rotated.length();
    const direction = rotated.normalize();

    const currentDistance = camera.position.length();
    const CLOSE_UP_MARGIN = 1.3; // scene units of "breathing room" past the satellite
    const distance = Math.min(
      Math.max(currentDistance, satRadius + CLOSE_UP_MARGIN),
      MAX_CAMERA_DISTANCE
    );

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
