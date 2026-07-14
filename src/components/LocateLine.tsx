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

// three.js's built-in LineDashedMaterial has no offset uniform in this
// version — its fragment shader only tests `mod(vLineDistance, totalSize)
// > dashSize`, with nothing to animate. This is the same test, plus a
// `dashOffset` uniform we control, so the pattern can actually flow.
const DASH_VERTEX = /* glsl */ `
  attribute float lineDistance;
  varying float vLineDistance;
  void main() {
    vLineDistance = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DASH_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  uniform float dashSize;
  uniform float gapSize;
  uniform float dashOffset;
  varying float vLineDistance;
  void main() {
    if (mod(vLineDistance + dashOffset, dashSize + gapSize) > dashSize) discard;
    gl_FragColor = vec4(color, opacity);
  }
`;

/**
 * Temporary visual line drawn between the observer's location (on the
 * globe surface) and the currently tracked satellite — powers the "Where
 * Am I?" quick action. Purely presentational; the parent controls how long
 * it stays mounted (OrbitWatchApp clears it a few seconds after showing).
 */
export default function LocateLine({ satelliteId, satellites, observerLat, observerLon }: Props) {
  const lineRef = useRef<THREE.Line>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const positions = useRef(new Float32Array(6));
  // Reused each frame instead of allocating a new Vector3 60x/sec.
  const pulsePos = useRef(new THREE.Vector3());

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
  const observerVec = useMemo(
    () => new THREE.Vector3(observerPos[0], observerPos[1], observerPos[2]),
    [observerPos]
  );

  const dashUniforms = useMemo(
    () => ({
      color: { value: new THREE.Color("#FFB84D") },
      opacity: { value: 0.85 },
      dashSize: { value: 0.06 },
      gapSize: { value: 0.04 },
      dashOffset: { value: 0 },
    }),
    []
  );

  // Geometry needs its position attribute created once, then updated in place.
  useEffect(() => {
    const geom = lineRef.current?.geometry as THREE.BufferGeometry | undefined;
    if (!geom) return;
    geom.setAttribute("position", new THREE.BufferAttribute(positions.current, 3));
  }, []);

  // How long one full sweep (your location → satellite → back) takes, in
  // seconds — this is what actually reads as "live" rather than a static
  // line, independent of the subtler flowing-dash pattern below.
  const PULSE_DURATION_SEC = 2.2;

  useFrame((state, delta) => {
    if (!satrec || !lineRef.current) return;
    const satState = propagate(satrec, getSimTime());
    if (!satState) return;
    const [sx, sy, sz] = geodeticToVector3(
      satState.lat,
      satState.lon,
      satState.altitudeKm,
      EARTH_RADIUS
    );

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

    // Feeds our shader's `lineDistance` attribute — computeLineDistances()
    // is a generic THREE.Line method (not tied to any particular
    // material), so it works fine alongside a custom ShaderMaterial. Both
    // endpoints of this line move every frame (the satellite orbits, and
    // Earth's rotation is folded into WorldSpin above us), so this has to
    // be recomputed every frame or the dash pattern goes stale/distorts as
    // the line changes length.
    lineRef.current.computeLineDistances();

    // Flowing animation: slide the dash pattern along the line over time.
    // delta-based so the flow speed stays consistent regardless of frame
    // rate. Tune 0.15 to taste — higher is a faster "current".
    dashUniforms.dashOffset.value -= delta * 0.15;

    // Traveling pulse: a bright dot that sweeps between the satellite and
    // your saved location and back, on a continuous ping-pong (triangle
    // wave) so it never visibly jumps — it always ends its trip exactly at
    // your location marker, then heads back out to the satellite. This is
    // the part that's actually meant to read as "live" at a glance, since
    // the dashed flow alone is subtle from a zoomed-out view.
    if (pulseRef.current) {
      const elapsed = state.clock.getElapsedTime();
      const cycle = (elapsed % PULSE_DURATION_SEC) / PULSE_DURATION_SEC; // 0..1
      const t = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2; // 0 -> 1 -> 0, no snap-back
      pulsePos.current.set(sx, sy, sz).lerp(observerVec, t);
      pulseRef.current.position.copy(pulsePos.current);
    }
  });

  return (
    <group>
      <line ref={lineRef as any}>
        <bufferGeometry />
        <shaderMaterial
          transparent
          uniforms={dashUniforms}
          vertexShader={DASH_VERTEX}
          fragmentShader={DASH_FRAGMENT}
        />
      </line>
      {/* Traveling pulse — the clearly-moving part of this effect. */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#FFDD99" transparent opacity={0.95} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Small marker pinning the observer's location on the globe */}
      <mesh position={observerPos as unknown as [number, number, number]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#FFB84D" />
      </mesh>
    </group>
  );
}
