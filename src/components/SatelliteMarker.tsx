"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import * as satellite from "satellite.js";
import { EARTH_RADIUS } from "./Earth";
import { geodeticToVector3, propagate, getOrbitalElements, type LiveState } from "@/lib/orbit";
import type { CatalogEntry } from "@/lib/satellite-catalog";
import { CATEGORY_COLOR, genericImageSlug } from "@/lib/satellite-catalog";
import { getSimTime } from "@/lib/sim-clock";

type Props = {
  entry: CatalogEntry;
  line1: string;
  line2: string;
  isSelected: boolean;
  onSelect: (id: number, state: LiveState | null) => void;
  showOrbitPath?: boolean;
  // While riding along in "Fly With Satellite", the camera sits much closer
  // to the satellite than in the normal orbit view. drei's <Html
  // distanceFactor> scales its element up the closer the camera gets — at
  // the old, much tighter chase distance this blew the floating name/stats
  // tag up to an enormous, clipped-off-screen size (the "very zoomed, can't
  // show full" bug). The chase camera has since been pulled back, but this
  // tag is also redundant during fly mode (the exit-fly-mode HUD already
  // shows what's selected), so it's suppressed here as a second safeguard.
  flyMode?: boolean;
};

type PhotoState =
  | { status: "pending" }
  | { status: "loaded"; texture: THREE.Texture; aspect: number }
  | { status: "error" };

/**
 * Loads /satellites/<slug>.png if present, without ever throwing or
 * blocking render. Returns a distinct "pending" state (rather than
 * collapsing "still loading" and "failed to load" into the same falsy
 * value) so the caller can wait for a real result instead of immediately
 * rendering the cartoon fallback and then swapping — which is what used to
 * cause a visible flash of the wrong (cartoon) icon for a beat right after
 * the page loaded, before the real photo finished fetching.
 */
function useOptionalSatellitePhoto(slug: string | undefined) {
  const [state, setState] = useState<PhotoState>({ status: "pending" });

  useEffect(() => {
    setState({ status: "pending" });
    if (!slug) {
      setState({ status: "error" });
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      `/satellites/${slug}.png`,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        const aspect = tex.image ? tex.image.width / tex.image.height : 1;
        setState({ status: "loaded", texture: tex, aspect });
      },
      undefined,
      () => {
        if (cancelled) return;
        setState({ status: "error" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}

/** A real photo of the satellite, always facing the camera, sized to
 * roughly match the footprint of the procedural model it replaces. */
function SatellitePhoto({
  texture,
  aspect,
  targetScale,
}: {
  texture: THREE.Texture;
  aspect: number;
  targetScale: number;
}) {
  const scaleRef = useRef<THREE.Group>(null);
  const baseHeight = 0.26; // matched against the procedural model's wingspan so photos don't read smaller

  useFrame((_, delta) => {
    if (scaleRef.current) {
      const s = scaleRef.current.scale.x + (targetScale - scaleRef.current.scale.x) * Math.min(delta * 8, 1);
      scaleRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={scaleRef}>
      <Billboard>
        <mesh scale={[baseHeight * aspect, baseHeight, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

/** A small procedural satellite: body + solar panel wings + antenna — no
 * external model files needed, cheap to render dozens of at once. Used as
 * the fallback whenever a real photo isn't available for this satellite. */
function SatelliteModel({ color, targetScale }: { color: string; targetScale: number }) {
  const spinRef = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.6;
    if (scaleRef.current) {
      const s = scaleRef.current.scale.x + (targetScale - scaleRef.current.scale.x) * Math.min(delta * 8, 1);
      scaleRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={scaleRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.05, 0.035, 0.035]} />
        <meshStandardMaterial color="#C7CEDB" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.03, 6]} />
        <meshStandardMaterial color="#8A93A6" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Solar panel wings, slowly rotating about the body's long axis */}
      <group ref={spinRef}>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.045]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[-0.09, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.045]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Beacon glow — brightens when selected via parent scale/emissive tweaks */}
      <mesh position={[0, 0.012, 0.02]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Minimal placeholder shown only while a real photo is still loading (now
 * a near-instant window in practice, thanks to preloadSatelliteIcons() —
 * see lib/satellite-icon-preload.ts). Deliberately not the full cartoon
 * model: a plain soft dot doesn't read as "a specific — and wrong — kind of
 * satellite" the way the winged procedural model did during that flash. */
function SatellitePending({ color, targetScale }: { color: string; targetScale: number }) {
  return (
    <group scale={targetScale}>
      <mesh>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export default function SatelliteMarker({
  entry,
  line1,
  line2,
  isSelected,
  onSelect,
  showOrbitPath = false,
  flyMode = false,
}: Props) {
  const satrec = useMemo(() => satellite.twoline2satrec(line1, line2), [line1, line2]);
  const groupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Line>(null);
  const [hovered, setHovered] = useState(false);
  const [label, setLabel] = useState<LiveState | null>(null);
  const lastTelemetryPush = useRef(0);
  const color = CATEGORY_COLOR[entry.category];
  const photoState = useOptionalSatellitePhoto(entry.imageSlug ?? genericImageSlug(entry.category));

  // Precompute a short trailing arc (~10 min behind) once per satrec; cheap and static-ish.
  const trailPositions = useMemo(() => {
    const pts: number[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 30 * 1000); // 30s steps, 10 min trail
      const s = propagate(satrec, t);
      if (!s) continue;
      const [x, y, z] = geodeticToVector3(s.lat, s.lon, s.altitudeKm, EARTH_RADIUS);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [satrec]);

  // Full-orbit path: one complete revolution sampled ahead of "now", shown
  // only when the person toggles "SHOW ORBITS" on — free (client-side
  // satellite.js math already loaded) and off by default to avoid clutter.
  const orbitPathPositions = useMemo(() => {
    if (!showOrbitPath) return null;
    let periodMin = 90;
    try {
      periodMin = getOrbitalElements(satrec).periodMin;
    } catch {
      /* fall back to default LEO-ish period */
    }
    const steps = 120;
    const pts: number[] = [];
    const now = Date.now();
    for (let i = 0; i <= steps; i++) {
      const t = new Date(now + (i / steps) * periodMin * 60 * 1000);
      const s = propagate(satrec, t);
      if (!s) continue;
      const [x, y, z] = geodeticToVector3(s.lat, s.lon, s.altitudeKm, EARTH_RADIUS);
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [satrec, showOrbitPath]);

  const outward = useMemo(() => new THREE.Vector3(), []);
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const state = propagate(satrec, getSimTime());
    if (!state || !groupRef.current) return;
    const [x, y, z] = geodeticToVector3(state.lat, state.lon, state.altitudeKm, EARTH_RADIUS);
    groupRef.current.position.set(x, y, z);

    // Orient the model "standing up" pointing away from Earth's center —
    // reads as a satellite floating in orbit rather than a flat sticker.
    outward.set(x, y, z).normalize();
    quat.setFromUnitVectors(upAxis, outward);
    groupRef.current.quaternion.copy(quat);

    if (isSelected) {
      const now = clock.getElapsedTime();
      if (now - lastTelemetryPush.current > 0.5) {
        lastTelemetryPush.current = now;
        onSelect(entry.id, state);
        setLabel(state);
      }
    }
  });

  const modelScale = isSelected ? 1.7 : hovered ? 1.35 : 1;

  return (
    <group>
      <line ref={trailRef as any}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </line>

      {orbitPathPositions && (
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[orbitPathPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.18} />
        </line>
      )}

      <group ref={groupRef}>
        {/* Invisible larger hit-target sphere makes the small model easy to click/tap */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            const state = propagate(satrec, getSimTime());
            onSelect(entry.id, state);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {photoState.status === "loaded" ? (
          <SatellitePhoto
            texture={photoState.texture}
            aspect={photoState.aspect}
            targetScale={modelScale}
          />
        ) : photoState.status === "pending" ? (
          <SatellitePending color={color} targetScale={modelScale} />
        ) : (
          <SatelliteModel color={color} targetScale={modelScale} />
        )}

        {isSelected && (
          <mesh>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.12} />
          </mesh>
        )}

        {/* Floating info tag that follows the satellite in 3D space, offset
            to the side (not centered on top of it) so the model itself
            stays visible instead of being covered by its own label. */}
        {isSelected && label && !flyMode && (
          <Html position={[0, 0.06, 0]} distanceFactor={6} zIndexRange={[10, 0]}>
            <div
              className="pointer-events-none whitespace-nowrap rounded-xl border border-white/5 bg-space-900/70 px-2 py-1 text-center font-mono backdrop-blur-xl"
              style={{
                fontSize: "10px",
                lineHeight: 1.3,
                transform: "translate(14px, -130%)",
                // Bounds the box's own width so a long satellite name can't
                // make it wider than necessary — the actual fix for the
                // scale-runaway bug is suppressing this tag in fly mode
                // (above) and keeping the chase camera at a sane distance.
                maxWidth: "220px",
              }}
            >
              <div className="font-bold text-ink truncate">{entry.name}</div>
              <div className="text-muted">
                {label.altitudeKm.toFixed(0)} km · {label.velocityKmS.toFixed(2)} km/s
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
