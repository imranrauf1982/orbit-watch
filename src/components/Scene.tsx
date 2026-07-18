"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera, Stats } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import * as satellite from "satellite.js";
import Earth, { EARTH_RADIUS } from "./Earth";
import SatelliteMarker from "./SatelliteMarker";
import SatelliteCloud from "./SatelliteCloud";
import CameraFocus, { MAX_CAMERA_DISTANCE } from "./CameraFocus";
import FlyCam from "./FlyCam";
import LocateLine from "./LocateLine";
import ContinentLabels from "./ContinentLabels";
import { propagate, geodeticToVector3 } from "@/lib/orbit";
import { getSimTime } from "@/lib/sim-clock";
import { getEarthSpinAngle, applyEarthSpin } from "@/lib/earth-spin";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import type { ObserverLocation } from "@/lib/use-location";
import {
  SATELLITE_CATALOG,
  FEATURED_IDS,
  bulkObjectGroup,
  type FilterGroup,
} from "@/lib/satellite-catalog";

type Props = {
  satellites: TleResult[]; // full filtered set for this view (featured ∪ mass)
  selectedId: number | null;
  onSelect: (id: number, state: LiveState | null) => void;
  filter: FilterGroup;
  showDots: boolean;
  showOrbitPaths?: boolean;
  // "Fly With Satellite" chase-cam mode (Quick Actions).
  flyMode?: boolean;
  // "Where Am I?" temporary observer<->satellite line (Quick Actions).
  locateLine?: { id: number; key: number } | null;
  location?: ObserverLocation | null;
};

const LOCATE_DURATION_SEC = 0.9;

/**
 * "Where Am I?" should actually take the person to the globe and show them
 * the line, not just draw it somewhere off-screen. This swings the camera
 * (preserving current zoom, same approach as CameraFocus) to face the
 * midpoint direction between the observer's location and the tracked
 * satellite, so both ends of the line land in view together.
 */
function LocateFocus({
  locateLine,
  location,
  satellites,
  controlsRef,
}: {
  locateLine: { id: number; key: number } | null;
  location: { lat: number; lon: number } | null;
  satellites: { id: number; line1: string; line2: string }[];
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);

  useEffect(() => {
    if (!locateLine || !location) return;
    const sat = satellites.find((s) => s.id === locateLine.id);
    if (!sat) return;
    let satrec: satellite.SatRec;
    try {
      satrec = satellite.twoline2satrec(sat.line1, sat.line2);
    } catch {
      return;
    }
    const simTime = getSimTime();
    const state = propagate(satrec, simTime);
    if (!state) return;
    const spinAngle = getEarthSpinAngle(simTime);

    const [sx, sy, sz] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    const satRotated = applyEarthSpin(new THREE.Vector3(sx, sy, sz), spinAngle);
    // Distance of the satellite from Earth's center, in scene units —
    // needed *before* normalizing satRotated into a pure direction.
    const satRadius = satRotated.length();
    const satDir = satRotated.clone().normalize();
    const [ox, oy, oz] = geodeticToVector3(location.lat, location.lon, 0, EARTH_RADIUS);
    const obsDir = applyEarthSpin(new THREE.Vector3(ox, oy, oz), spinAngle).normalize();

    // Average direction between the two points, so both the observer marker
    // and the satellite land in view together rather than one going
    // off-screen behind the globe.
    const midDir = satDir.add(obsDir).normalize();

    // This used to only ever preserve whatever distance the camera already
    // happened to be at — fine when the satellite is near Earth (LEO), but
    // for anything at MEO/GEO altitude (GPS, Galileo, GLONASS...) that
    // distance is often *shorter* than the satellite's own distance from
    // Earth's center. The satellite would then render behind the camera
    // along this same ray no matter how the camera was aimed — which is
    // exactly what made "What's Above Me?" look like the line pointed at
    // nothing, only "finding" the object if the person happened to zoom out
    // manually.
    //
    // A *fixed* margin above the satellite's own distance (not a
    // proportional one) is what makes it read as "close/overhead" rather
    // than "small and far away" — a proportional margin grows right along
    // with altitude, so a GEO satellite would push the camera (and
    // therefore everything else) proportionally farther out too. Keeping
    // the camera-to-satellite gap fixed and small means the satellite stays
    // large/prominent in frame no matter its real altitude, while Earth and
    // the location line remain visible behind it — clamped to the same max
    // zoom OrbitControls allows, and never zoomed *in* past whatever
    // distance the person already had.
    // and never zoom *in* past whatever distance the person already had.
    const currentDistance = camera.position.length();
    const CLOSE_UP_MARGIN = 1.3; // scene units of "breathing room" past the satellite
    const distance = Math.min(
      Math.max(currentDistance, satRadius + CLOSE_UP_MARGIN),
      MAX_CAMERA_DISTANCE
    );

    anim.current = {
      from: camera.position.clone(),
      to: midDir.multiplyScalar(distance),
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locateLine, location, satellites]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + delta / LOCATE_DURATION_SEC);
    const eased = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerpVectors(a.from, a.to, eased);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update?.();
    if (a.t >= 1) anim.current = null;
  });

  return null;
}

/**
 * Rotates Earth's texture, every satellite, the continent labels, and the
 * "Where Am I?" line together, as one rigid group, at Earth's real sidereal
 * rate — scaled by whatever the sim-speed control (1x/10x/.../3600x) is set
 * to, via getSimTime(). This replaces an earlier version that rotated only
 * the Earth mesh, on its own arbitrary schedule tied to real animation
 * frame-time rather than the sim clock: at higher sim speeds the satellites
 * (which do use the sim clock) would race far ahead of the slowly-crawling
 * globe, and at 1x the two had no consistent relationship at all. Rotating
 * everything as one group, driven by the same clock the satellites use,
 * keeps the globe and every orbit visibly moving together in the correct
 * ~16:1 ratio (one Earth rotation per ~16 LEO orbits) at every speed
 * setting, and they can never drift apart from each other since it's a
 * single transform applied once, not two independent ones.
 */
function WorldSpin({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = getEarthSpinAngle(getSimTime());
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

export default function Scene({
  satellites,
  selectedId,
  onSelect,
  filter,
  showDots,
  showOrbitPaths = false,
  flyMode = false,
  locateLine = null,
  location = null,
}: Props) {
  const controlsRef = useRef<any>(null);

  // Perf overlay (stats-gl style FPS/MS/MB panel) — free, dev-only, opt-in
  // via ?debug=1 so it never shows for regular visitors.
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  // Detailed procedural models: the curated catalog, whatever's currently
  // selected, and whatever the "Where Am I?"/"What's Above Me?" line is
  // currently pointing at. That last one matters because those cards find
  // satellites from the *entire* tracked set, not just the curated 16 —
  // without this, the located object would only ever get a tiny point in
  // the mass cloud (or nothing, if dots were hidden), leaving the line
  // pointing at what looked like empty space.
  const detailed = useMemo(
    () =>
      satellites.filter(
        (s) => FEATURED_IDS.has(s.id) || s.id === selectedId || s.id === locateLine?.id
      ),
    [satellites, selectedId, locateLine?.id]
  );

  // Everything else renders as an instanced point cloud (Phase 2).
  const mass = useMemo(() => {
    const detailedIds = new Set(detailed.map((s) => s.id));
    return satellites.filter((s) => {
      if (detailedIds.has(s.id)) return false;
      if (filter === "starlink") return bulkObjectGroup(s.name, s.id) === "starlink";
      if (filter === "stations") return bulkObjectGroup(s.name, s.id) === "station";
      return true; // "all" and "featured" both fall back to whatever's left after detailed filtering
    });
  }, [satellites, detailed, filter]);

  // Small perf win on phones: slightly lower the device-pixel-ratio cap and
  // background star count on narrow screens. Desktop keeps the original
  // values untouched (dpr up to 1.75, 2500 stars).
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsNarrow(mq.matches);
    const onChange = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <Canvas
      dpr={isNarrow ? 1 : [1, 1.75]} // no supersampling on phones — biggest single lever on render cost
      gl={{ antialias: !isNarrow, powerPreference: "high-performance" }} // MSAA is expensive; skip it on narrow screens
      className="!touch-none"
    >
      <PerspectiveCamera makeDefault fov={45} />
      <color attach="background" args={["#05070D"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} />

      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={isNarrow ? 1400 : 2500} factor={2} saturation={0} fade speed={0.4} />
        <WorldSpin>
          <Earth />
          <ContinentLabels dim={flyMode} />
          {detailed.map((sat) => {
            const entry =
              SATELLITE_CATALOG.find((c) => c.id === sat.id) ?? {
                id: sat.id,
                name: sat.name,
                category:
                  bulkObjectGroup(sat.name, sat.id) === "station"
                    ? ("station" as const)
                    : bulkObjectGroup(sat.name, sat.id) === "starlink"
                    ? ("constellation" as const)
                    : ("science" as const),
              };
            return (
              <SatelliteMarker
                key={sat.id}
                entry={entry}
                line1={sat.line1}
                line2={sat.line2}
                isSelected={selectedId === sat.id}
                isHighlighted={locateLine?.id === sat.id}
                onSelect={onSelect}
                showOrbitPath={showOrbitPaths && (selectedId === sat.id || FEATURED_IDS.has(sat.id))}
                flyMode={flyMode}
              />
            );
          })}
          {filter !== "featured" && showDots && (
            <SatelliteCloud satellites={mass} onSelect={onSelect} />
          )}

          {/* "Where Am I?" — temporary line from the observer's location to
              the tracked satellite. Self-clears; parent controls lifetime. */}
          {locateLine && location && (
            <LocateLine
              key={locateLine.key}
              satelliteId={locateLine.id}
              satellites={satellites}
              observerLat={location.lat}
              observerLon={location.lon}
            />
          )}
        </WorldSpin>
      </Suspense>

      {debug && <Stats className="!left-auto !right-2 !top-2" />}

      {/* Swings the camera to face whatever gets selected, from any source
          (list, search, map, clicking a dot on the far side of the globe).
          Skipped while flying — FlyCam owns the camera during chase mode. */}
      {!flyMode && (
        <CameraFocus selectedId={selectedId} satellites={satellites} controlsRef={controlsRef} />
      )}
      {!flyMode && (
        <LocateFocus
          locateLine={locateLine}
          location={location}
          satellites={satellites}
          controlsRef={controlsRef}
        />
      )}

      {/* "Fly With Satellite" — chase cam. Only active in flyMode. */}
      <FlyCam
        active={flyMode}
        satelliteId={selectedId}
        satellites={satellites}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enabled={!flyMode}
        enablePan={false}
        // EARTH_RADIUS (2.4 scene units) maps to the real 6,371 km Earth
        // radius — see lib/orbit.ts's geodeticToVector3, scale =
        // EARTH_RADIUS / 6371. So minDistance isn't itself a km value; it's
        // camera distance from the globe's *center* in scene units.
        //   2.75 units → (2.75 / 2.4) * 6371 ≈ 7,300 km from center
        //              → roughly 930 km altitude above the surface —
        //                close enough to feel dramatic next to LEO
        //                satellites (ISS ~400 km, most Earth-science sats
        //                ~700 km) while staying safely outside the cloud
        //                shell (2.4 * 1.012) and atmosphere glow shell
        //                (2.4 * 1.045) so neither renders oddly from
        //                inside. The previous 3.2 capped altitude at
        //                ~2,124 km — farther out than most of the
        //                satellites being tracked.
        minDistance={flyMode ? 0.3 : 2.75}
        maxDistance={flyMode ? 20 : MAX_CAMERA_DISTANCE}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
      />
    </Canvas>
  );
}
