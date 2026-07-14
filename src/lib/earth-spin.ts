import * as THREE from "three";

/**
 * Real sidereal day length (Earth's actual rotation period relative to the
 * stars), in seconds. Used — rather than an arbitrary "looks nice" spin
 * speed — so the globe's rotation and every satellite's orbital motion stay
 * in the same, physically consistent ratio no matter what the sim-speed
 * multiplier (1x/10x/60x/600x/3600x) is set to. A satellite completing an
 * orbit in ~90 minutes should sweep around a globe that's completing its
 * own rotation in ~24 hours — that ~16:1 ratio is what actually reads as
 * "correct" rather than arbitrary.
 */
export const SIDEREAL_DAY_SEC = 86164.0905;

/**
 * Earth's rotation angle (radians, about +Y) at a given simulated time.
 * Deliberately a pure function of absolute time (not an incremental
 * accumulator) — recomputing from scratch every frame means pausing,
 * resuming, or jumping the sim-speed multiplier can never leave rotation
 * "out of sync" with itself, and there's nothing to drift.
 */
export function getEarthSpinAngle(simTime: Date): number {
  const totalSec = simTime.getTime() / 1000;
  const frac = ((totalSec % SIDEREAL_DAY_SEC) + SIDEREAL_DAY_SEC) % SIDEREAL_DAY_SEC;
  return (frac / SIDEREAL_DAY_SEC) * Math.PI * 2;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * Rotates a local (pre-spin) position — as produced by geodeticToVector3 —
 * into current world space. Every satellite, the "Where Am I?" line, and
 * the continent labels all live inside a single <group> in Scene.tsx whose
 * rotation.y is set to getEarthSpinAngle() each frame; components that need
 * a world-space position *outside* that group (camera-aiming code in
 * CameraFocus/FlyCam/the locate-line focus) use this helper to match it,
 * so the camera always points at where the satellite actually renders.
 */
export function applyEarthSpin(v: THREE.Vector3, angle: number): THREE.Vector3 {
  return v.applyAxisAngle(Y_AXIS, angle);
}
