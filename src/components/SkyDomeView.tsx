"use client";

import { useEffect, useMemo, useState } from "react";
import * as satellite from "satellite.js";
import { getLookAngles } from "@/lib/topocentric";
import { propagate, type LiveState } from "@/lib/orbit";
import {
  SATELLITE_CATALOG,
  CATEGORY_COLOR,
  FEATURED_IDS,
  bulkObjectGroup,
  bulkObjectColor,
  type FilterGroup,
} from "@/lib/satellite-catalog";
import type { TleResult } from "@/lib/fetch-tle";
import type { ObserverLocation, LocationStatus } from "@/lib/use-location";
import LocationSearch from "./LocationSearch";

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  onSelect: (id: number, state: LiveState | null) => void;
  filter: FilterGroup;
  showDots: boolean;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
};

const SIZE = 400;
const CENTER = SIZE / 2;
const HORIZON_RADIUS = 172;

/** Elevation (0-90°) -> pixel radius from center. 90° (zenith) is the
 * middle of the dome, 0° (horizon) is the outer ring — the standard
 * planetarium / satellite-spotting sky-chart projection. */
function radiusForElevation(elevationDeg: number): number {
  return HORIZON_RADIUS * (1 - elevationDeg / 90);
}

/** Azimuth (0-360°, clockwise from North) + elevation -> screen x/y. */
function pointFor(azimuthDeg: number, elevationDeg: number): [number, number] {
  const r = radiusForElevation(elevationDeg);
  const rad = (azimuthDeg * Math.PI) / 180;
  const x = CENTER + r * Math.sin(rad);
  const y = CENTER - r * Math.cos(rad);
  return [x, y];
}

type PlottedSatellite = {
  id: number;
  name: string;
  color: string;
  azimuthDeg: number;
  elevationDeg: number;
  featured: boolean;
};

export default function SkyDomeView({
  satellites,
  selectedId,
  onSelect,
  filter,
  showDots,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Same filter-tab logic as Scene/MapView, so "Sky" respects whatever
  // group the person already has selected elsewhere in the app.
  const candidateSatellites = useMemo(() => {
    let base: TleResult[];
    if (filter === "featured") {
      base = satellites.filter((s) => FEATURED_IDS.has(s.id) || s.id === selectedId);
    } else if (filter === "starlink") {
      base = satellites.filter(
        (s) => FEATURED_IDS.has(s.id) || s.id === selectedId || bulkObjectGroup(s.name, s.id) === "starlink"
      );
    } else if (filter === "stations") {
      base = satellites.filter(
        (s) => FEATURED_IDS.has(s.id) || s.id === selectedId || bulkObjectGroup(s.name, s.id) === "station"
      );
    } else {
      base = satellites;
    }
    if (!showDots) {
      base = base.filter((s) => FEATURED_IDS.has(s.id) || s.id === selectedId);
    }
    return base;
  }, [satellites, filter, showDots, selectedId]);

  const satrecs = useMemo(() => {
    const map = new Map<number, satellite.SatRec>();
    for (const s of candidateSatellites) {
      try {
        map.set(s.id, satellite.twoline2satrec(s.line1, s.line2));
      } catch {
        // skip malformed elements
      }
    }
    return map;
  }, [candidateSatellites]);

  // Only satellites actually above the horizon get plotted — this is what
  // keeps the dome readable even under "All Active": most of the catalog
  // is on the other side of the planet at any given moment.
  const plotted: PlottedSatellite[] = useMemo(() => {
    if (!location) return [];
    const date = new Date(now);
    const results: PlottedSatellite[] = [];
    for (const sat of candidateSatellites) {
      const rec = satrecs.get(sat.id);
      if (!rec) continue;
      const look = getLookAngles(rec, location.lat, location.lon, date);
      if (!look || look.elevationDeg <= 0) continue;
      const entry = SATELLITE_CATALOG.find((c) => c.id === sat.id);
      results.push({
        id: sat.id,
        name: entry?.name ?? sat.name,
        color: entry ? CATEGORY_COLOR[entry.category] : bulkObjectColor(sat.name, sat.id),
        azimuthDeg: look.azimuthDeg,
        elevationDeg: look.elevationDeg,
        featured: entry !== undefined,
      });
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateSatellites, satrecs, location, now]);

  const handlePick = (sat: PlottedSatellite) => {
    const rec = satrecs.get(sat.id);
    if (!rec) return;
    const state = propagate(rec, new Date());
    onSelect(sat.id, state);
  };

  if (!location) {
    return (
      <div className="h-full w-full bg-void flex items-center justify-center p-6">
        <div className="max-w-xs w-full rounded-xl border border-white/5 bg-space-900/70 backdrop-blur-xl p-5 text-center">
          <p className="text-sm text-ink font-body mb-1">Sky view needs your location</p>
          <p className="text-xs text-muted font-body mb-4">
            It plots what's actually overhead right now, so it needs to know where "up" is for you.
          </p>
          <button
            onClick={onRequestLocation}
            disabled={locationStatus === "requesting"}
            className="w-full rounded-xl border border-signal/40 bg-gradient-to-r from-signal/10 to-signal/5 text-signal shadow-[0_0_15px_rgba(255,106,61,0.12)] px-3 py-2 text-xs font-mono hover:bg-signal/30 disabled:opacity-50 transition-all duration-300 ease-out"
          >
            {locationStatus === "requesting" ? "LOCATING…" : "USE MY LOCATION"}
          </button>
          {locationStatus === "denied" && (
            <p className="mt-2 text-[11px] text-warn font-mono">
              Location denied — search for a place instead.
            </p>
          )}
          <LocationSearch onPick={onManualLocation} />
        </div>
      </div>
    );
  }

  const compassTicks = [
    { label: "N", az: 0 },
    { label: "E", az: 90 },
    { label: "S", az: 180 },
    { label: "W", az: 270 },
  ];
  const elevationRings = [0, 30, 60];

  return (
    <div className="h-full w-full bg-void flex items-center justify-center p-4">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full max-w-[560px] max-h-[560px]">
        {/* Elevation rings */}
        {elevationRings.map((el) => (
          <circle
            key={el}
            cx={CENTER}
            cy={CENTER}
            r={radiusForElevation(el)}
            fill="none"
            stroke="#2A3040"
            strokeWidth={1}
            strokeDasharray={el === 0 ? undefined : "3 4"}
          />
        ))}
        {elevationRings
          .filter((el) => el > 0)
          .map((el) => (
            <text
              key={`label-${el}`}
              x={CENTER + 4}
              y={CENTER - radiusForElevation(el) + 12}
              fontSize={9}
              fontFamily="monospace"
              fill="#5A6273"
            >
              {el}°
            </text>
          ))}

        {/* Compass spokes + labels */}
        {compassTicks.map(({ label, az }) => {
          const [x, y] = pointFor(az, 0);
          const [tx, ty] = pointFor(az, -6); // just outside the horizon ring
          return (
            <g key={label}>
              <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#1C212C" strokeWidth={1} />
              <text
                x={tx}
                y={ty}
                fontSize={13}
                fontFamily="monospace"
                fontWeight="bold"
                fill="#8A93A6"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            </g>
          );
        })}

        <text
          x={CENTER}
          y={CENTER}
          fontSize={8}
          fontFamily="monospace"
          fill="#3A4152"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          ZENITH
        </text>

        {/* Satellites currently above the horizon */}
        {plotted.map((sat) => {
          const [x, y] = pointFor(sat.azimuthDeg, sat.elevationDeg);
          const isSelected = sat.id === selectedId;
          const r = isSelected ? 6 : sat.featured ? 4 : 2.5;
          return (
            <g
              key={sat.id}
              onClick={() => handlePick(sat)}
              className="cursor-pointer"
              style={{ pointerEvents: "auto" }}
            >
              {isSelected && (
                <circle cx={x} cy={y} r={r + 5} fill={sat.color} opacity={0.15} />
              )}
              <circle cx={x} cy={y} r={r} fill={sat.color} stroke={isSelected ? "#FFFFFF" : "none"} strokeWidth={1.5} />
              {(isSelected || sat.featured) && (
                <text
                  x={x + r + 4}
                  y={y}
                  fontSize={10}
                  fontFamily="monospace"
                  fill="#E8EAF0"
                  dominantBaseline="middle"
                >
                  {sat.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
