"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { subsolarPoint } from "@/lib/sun";

export const EARTH_RADIUS = 2.4;

// Same convention as geodeticToVector3 in lib/orbit.ts: u = 0.5 + lon/360,
// Greenwich meridian at texture center — keeps satellite ground tracks
// aligned with the real continents rendered here.
function latLonToDirection(lat: number, lon: number): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lonRad),
    Math.sin(latRad),
    -Math.cos(latRad) * Math.sin(lonRad)
  );
}

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Blends day (real continents, lit) and night (city lights) textures based
// on the real subsolar direction, with a soft twilight terminator band.
const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float intensity = dot(vWorldNormal, normalize(sunDir));
    float dayAmount = smoothstep(-0.18, 0.15, intensity);

    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb * 1.6;

    vec3 color = mix(nightColor, dayColor, dayAmount);

    // subtle warm terminator glow
    float twilight = smoothstep(0.0, 0.22, 1.0 - abs(intensity)) * (1.0 - dayAmount * 0.6);
    color += vec3(0.35, 0.16, 0.06) * twilight * 0.25;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fresnel term (steepest at the grazing edge of the sphere, near-zero
// facing the camera) — this is what produces a genuine glowing rim
// instead of a flat, uniformly-transparent shell.
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 glowColor;
  uniform float power;
  uniform float strength;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), power);
    gl_FragColor = vec4(glowColor, fresnel * strength);
  }
`;

export default function Earth() {
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_day.jpg",
    "/textures/earth_lights.png",
    "/textures/earth_clouds.png",
  ]);

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDir: { value: new THREE.Vector3(1, 0, 0) },
    }),
    [dayMap, nightMap]
  );

  const lastSunUpdate = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.008; // slow ambient drift
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.012; // clouds drift slightly faster
    }
    // Real subsolar point barely moves within a few seconds — recompute
    // occasionally rather than every frame to keep this cheap.
    const now = state.clock.getElapsedTime();
    if (now - lastSunUpdate.current > 5) {
      lastSunUpdate.current = now;
      const { lat, lon } = subsolarPoint(new Date());
      earthUniforms.sunDir.value.copy(latLonToDirection(lat, lon));
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Core textured sphere — real continents, day/night blend */}
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
          <shaderMaterial
            uniforms={earthUniforms}
            vertexShader={EARTH_VERTEX}
            fragmentShader={EARTH_FRAGMENT}
          />
        </mesh>

        {/* Cloud layer — thin, semi-transparent, drifts independently */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[EARTH_RADIUS * 1.012, 64, 64]} />
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>

        {/* Faint equatorial ring — a small nod to the old tech-HUD look */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[EARTH_RADIUS * 1.0, EARTH_RADIUS * 1.002, 128]} />
          <meshBasicMaterial color="#4FD8EB" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Atmosphere rim glow — tight bright inner layer + soft wide outer
          halo, both using a real Fresnel falloff so the glow concentrates
          at the grazing edge (like actual atmospheric scattering) rather
          than reading as a uniform transparent shell. */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.015, 64, 64]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          uniforms={{
            glowColor: { value: new THREE.Color("#6FE3F5") },
            power: { value: 3.2 },
            strength: { value: 1.0 },
          }}
          transparent
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.09, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          uniforms={{
            glowColor: { value: new THREE.Color("#4FD8EB") },
            power: { value: 2.2 },
            strength: { value: 0.55 },
          }}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
