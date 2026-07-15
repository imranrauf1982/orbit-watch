"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as satellite from "satellite.js";
import { getLookAngles } from "@/lib/topocentric";
import { azimuthToCompass } from "@/lib/passes";
import { solarElevationDeg, skyPaletteForElevation, isEclipsed } from "@/lib/sun";
import { CATEGORY_LABEL, type CatalogEntry } from "@/lib/satellite-catalog";

type Props = {
  satId: number;
  satName: string;
  category: CatalogEntry["category"] | null;
  imageSlug: string;
  color: string;
  satrec: satellite.SatRec;
  location: { lat: number; lon: number };
  onClose: () => void;
};

// Layout constants for the "looking up from your roof" projection —
// horizon sits low in the frame, zenith near the top, matching how a
// person actually holds their head back to scan the sky.
const HORIZON_Y = 80; // % from top
const ZENITH_Y = 8; // % from top
const FOV_DEG = 70; // how much of the compass the frame spans left-to-right

/** Cheap seeded PRNG so the star field / cloud layout is stable per mount
 * instead of jittering on every re-render. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function SkyRealisticView({
  satId,
  satName,
  category,
  imageSlug,
  color,
  satrec,
  location,
  onClose,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [imgFailed, setImgFailed] = useState(false);
  const referenceAz = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close on Escape — the overlay otherwise has no keyboard trap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = useMemo(() => new Date(now), [now]);

  const look = useMemo(
    () => getLookAngles(satrec, location.lat, location.lon, date),
    [satrec, location.lat, location.lon, date]
  );

  const sunElevDeg = useMemo(
    () => solarElevationDeg(location.lat, location.lon, date),
    [location.lat, location.lon, date]
  );
  const palette = useMemo(() => skyPaletteForElevation(sunElevDeg), [sunElevDeg]);

  // Sunlit / eclipse check, purely for the plain-language visibility hint.
  const eclipsed = useMemo(() => {
    const pv = satellite.propagate(satrec, date);
    if (!pv || typeof pv.position === "boolean") return null;
    return isEclipsed(pv.position, date);
  }, [satrec, date]);

  const visibilityHint = useMemo(() => {
    if (!look) return "Currently below the horizon.";
    if (palette.isDaylight) {
      return "Sky's too bright to see it with the naked eye right now — the map is still tracking it accurately.";
    }
    if (eclipsed) {
      return "Passing through Earth's shadow right now — not catching any sunlight, so it won't be visible even though the sky is dark.";
    }
    return "Good conditions — look for a steady point of light drifting across the stars (no blinking, unlike a plane).";
  }, [look, palette.isDaylight, eclipsed]);

  // Lock the frame's "facing direction" to wherever the satellite first
  // appeared, so it drifts naturally across the view over time instead of
  // staying pinned dead-center (which would look static/fake).
  if (look && referenceAz.current === null) {
    referenceAz.current = look.azimuthDeg;
  }

  const seed = useMemo(() => satId * 7919 + 13, [satId]);
  const stars = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: 70 }).map(() => ({
      x: rand() * 100,
      y: rand() * 68,
      size: rand() * 1.6 + 0.4,
      delay: rand() * 6,
      dur: 2.5 + rand() * 3.5,
    }));
  }, [seed]);

  const clouds = useMemo(() => {
    const rand = mulberry32(seed + 101);
    return Array.from({ length: 4 }).map((_, i) => ({
      top: 10 + rand() * 55,
      width: 34 + rand() * 30,
      height: 8 + rand() * 6,
      dur: 38 + rand() * 40,
      delay: -rand() * 60,
      opacity: 0.35 + rand() * 0.3,
      reverse: i % 2 === 0,
    }));
  }, [seed]);

  let xPercent = 50;
  let yPercent = 50;
  let visible = false;
  if (look && look.elevationDeg > 0 && referenceAz.current !== null) {
    visible = true;
    let diff = look.azimuthDeg - referenceAz.current;
    diff = ((diff + 540) % 360) - 180; // -180..180
    xPercent = 50 + (diff / (FOV_DEG / 2)) * 50;
    xPercent = Math.min(96, Math.max(4, xPercent));
    const elevT = Math.min(1, Math.max(0, look.elevationDeg / 90));
    yPercent = HORIZON_Y - elevT * (HORIZON_Y - ZENITH_Y);
  }

  // Near the horizon the object is farther through the atmosphere: smaller,
  // hazier, dimmer. Near zenith it reads bigger and crisper.
  const elevT = look ? Math.min(1, Math.max(0, look.elevationDeg / 90)) : 0;
  const objectSize = 46 + elevT * 58;
  const objectBlur = (1 - elevT) * 1.6;
  const objectOpacity = 0.55 + elevT * 0.45;

  const compass = look ? azimuthToCompass(look.azimuthDeg) : null;
  const categoryLabel = category ? CATEGORY_LABEL[category] : "Satellite";

  return (
    <div
      className="fixed inset-0 z-[3000] overflow-hidden animate-panel-in"
      role="dialog"
      aria-label={`Realistic sky view of ${satName}`}
    >
      {/* Sky dome */}
      <div
        className="absolute inset-0 transition-colors duration-[3000ms]"
        style={{
          background: `linear-gradient(to bottom, ${palette.top} 0%, ${palette.mid} 55%, ${palette.horizon} 100%)`,
        }}
      >
        {/* Horizon glow (sunrise/sunset warmth) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38%] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, rgba(255,150,80,${palette.glowOpacity}) 0%, rgba(255,150,80,0) 70%)`,
          }}
        />

        {/* Stars */}
        <div
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{ opacity: palette.starsOpacity }}
        >
          {stars.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-star-twinkle"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.dur}s`,
              }}
            />
          ))}
        </div>

        {/* Drifting cloud layers */}
        {clouds.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-[50%] blur-2xl will-change-transform"
            style={{
              top: `${c.top}%`,
              width: `${c.width}vmax`,
              height: `${c.height}vmax`,
              left: "-40%",
              opacity: c.opacity * (palette.isDaylight ? 1 : 0.55),
              background: palette.isDaylight
                ? "rgba(255,255,255,0.9)"
                : "rgba(140,150,180,0.8)",
              animation: `${c.reverse ? "cloudDriftReverse" : "cloudDrift"} ${c.dur}s linear infinite`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

        {/* Roofline silhouette — grounds the view as "seen from your roof" */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: "16%" }}
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 L0,38 L40,38 L55,18 L70,38 L140,38 L140,26 L160,26 L160,38 L230,38 L245,14 L260,38 L330,38 L345,30 L400,30 L400,60 Z"
            fill="#04060b"
          />
        </svg>

        {/* The satellite / object itself */}
        {visible ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-1000 ease-linear animate-sky-float"
            style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: objectSize,
                height: objectSize,
                filter: `blur(${objectBlur}px)`,
                opacity: objectOpacity,
                boxShadow: palette.isDaylight
                  ? "none"
                  : `0 0 ${14 + elevT * 18}px 2px ${color}55`,
              }}
            >
              {!imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/satellites/${imageSlug}.png`}
                  alt={satName}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={() => setImgFailed(true)}
                  draggable={false}
                />
              ) : (
                <div
                  className="rounded-full"
                  style={{ width: objectSize * 0.35, height: objectSize * 0.35, background: color }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center px-6">
            <p className="text-sm font-mono text-muted">
              {satName} is below the horizon from here right now.
            </p>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-space-900/70 backdrop-blur-xl px-3.5 py-2.5 max-w-[75%]">
          <p className="text-[13px] font-body text-ink font-semibold leading-tight">{satName}</p>
          <p className="text-[11px] font-mono text-muted mt-0.5">
            {categoryLabel} · {palette.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto rounded-xl border border-white/10 bg-space-900/70 backdrop-blur-xl w-10 h-10 flex items-center justify-center text-ink hover:bg-white/10 transition-colors duration-200"
          aria-label="Close realistic sky view"
        >
          ✕
        </button>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 inset-x-0 p-4 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-white/10 bg-space-900/70 backdrop-blur-xl px-4 py-3">
          {visible && look ? (
            <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-2">
              <span>
                AZ <span className="text-ink">{look.azimuthDeg.toFixed(0)}°</span> ({compass})
              </span>
              <span>
                EL <span className="text-ink">{look.elevationDeg.toFixed(0)}°</span>
              </span>
              <span>
                RANGE <span className="text-ink">{look.rangeKm.toFixed(0)} km</span>
              </span>
            </div>
          ) : null}
          <p className="text-xs font-body text-ink/90 leading-relaxed">{visibilityHint}</p>
        </div>
      </div>
    </div>
  );
}
