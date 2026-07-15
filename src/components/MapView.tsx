"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import * as satellite from "satellite.js";
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
import type { ObserverLocation } from "@/lib/use-location";

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  onSelect: (id: number, state: LiveState | null) => void;
  location: ObserverLocation | null;
  filter: FilterGroup;
  showDots: boolean;
};

/** Splits a lon/lat track into segments, breaking wherever it wraps the antimeridian. */
function splitTrack(points: Array<[number, number]>): Array<Array<[number, number]>> {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  for (let i = 0; i < points.length; i++) {
    const [lat, lon] = points[i];
    if (current.length > 0) {
      const prevLon = current[current.length - 1][1];
      if (Math.abs(lon - prevLon) > 180) {
        segments.push(current);
        current = [];
      }
    }
    current.push([lat, lon]);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function Recenter({
  lat,
  lon,
  trigger,
}: {
  lat: number | null;
  lon: number | null;
  trigger: number;
}) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    // Nothing selected (yet) — don't touch the map, and don't consume the
    // "first" flag, so the *next* real selection still gets treated as the
    // first centering rather than a follow-up flyTo.
    if (lat === null || lon === null) return;
    if (first.current) {
      map.setView([lat, lon], 2);
      first.current = false;
      return;
    }
    map.flyTo([lat, lon], Math.max(map.getZoom(), 2), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

export default function MapView({ satellites, selectedId, onSelect, location, filter, showDots }: Props) {
  const [tick, setTick] = useState(0);

  // Mass sets update less often than the 3D view's worker cadence would
  // need in a browser main-thread loop — 2s keeps thousands of Leaflet
  // canvas redraws from competing with pan/zoom interaction.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  // Same detailed/mass split as the 3D Scene: curated + selected get full
  // treatment (tooltip, ground track eligibility); everything else is a
  // lightweight canvas-rendered dot (Phase 2).
  const visibleSatellites = useMemo(() => {
    // The selected satellite always renders, even if it falls outside the
    // active filter (e.g. picked via search, or a deep link) — otherwise
    // selecting it would make it vanish from the map.
    if (filter === "featured")
      return satellites.filter((s) => FEATURED_IDS.has(s.id) || s.id === selectedId);
    if (filter === "starlink")
      return satellites.filter(
        (s) =>
          FEATURED_IDS.has(s.id) ||
          s.id === selectedId ||
          bulkObjectGroup(s.name, s.id) === "starlink"
      );
    if (filter === "stations")
      return satellites.filter(
        (s) =>
          FEATURED_IDS.has(s.id) ||
          s.id === selectedId ||
          bulkObjectGroup(s.name, s.id) === "station"
      );
    return satellites;
  }, [satellites, filter, selectedId]);

  // When dots are hidden, skip propagating the mass set entirely too — not
  // just skip drawing it — so "Hide Dots" is also a real performance win,
  // not purely cosmetic.
  const renderedSatellites = useMemo(() => {
    if (showDots) return visibleSatellites;
    return visibleSatellites.filter((s) => FEATURED_IDS.has(s.id) || s.id === selectedId);
  }, [visibleSatellites, showDots, selectedId]);

  const satrecs = useMemo(() => {
    const map = new Map<number, satellite.SatRec>();
    for (const s of renderedSatellites) {
      try {
        map.set(s.id, satellite.twoline2satrec(s.line1, s.line2));
      } catch {
        // skip malformed elements
      }
    }
    return map;
  }, [renderedSatellites]);

  const positions = useMemo(() => {
    const now = new Date();
    const map = new Map<number, LiveState>();
    for (const [id, rec] of satrecs) {
      const state = propagate(rec, now);
      if (state) map.set(id, state);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satrecs, tick]);

  // Report live telemetry for the selected satellite up to the parent, same
  // contract SatelliteMarker uses in the 3D scene.
  useEffect(() => {
    if (selectedId === null) return;
    const state = positions.get(selectedId);
    if (state) onSelect(selectedId, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, selectedId]);

  const groundTrack = useMemo(() => {
    if (selectedId === null) return [];
    const rec = satrecs.get(selectedId);
    if (!rec) return [];
    const now = Date.now();
    const pts: Array<[number, number]> = [];
    for (let i = -45; i <= 45; i += 2) {
      const state = propagate(rec, new Date(now + i * 60 * 1000));
      if (state) pts.push([state.lat, state.lon]);
    }
    return splitTrack(pts);
  }, [selectedId, satrecs, tick]);

  const selectedPos = selectedId !== null ? positions.get(selectedId) : null;
  const selectedGroundColor =
    selectedId !== null
      ? CATEGORY_COLOR[SATELLITE_CATALOG.find((c) => c.id === selectedId)?.category ?? "science"]
      : "#4FD8EB";

  return (
    <div className="h-full w-full bg-void">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        zoomControl={false}
        // Canvas renderer batches all vector markers onto shared <canvas>
        // panes instead of one DOM node per marker (Phase 2) — the win that
        // matters once `filter` goes beyond the curated set.
        preferCanvas
        style={{ height: "100%", width: "100%", background: "#05070D" }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <Recenter
          lat={selectedPos ? selectedPos.lat : null}
          lon={selectedPos ? selectedPos.lon : null}
          trigger={selectedId ?? 0}
        />

        {groundTrack.map((segment, i) => (
          <Polyline
            key={i}
            positions={segment}
            pathOptions={{
              color: selectedGroundColor,
              weight: 2,
              opacity: 0.6,
              dashArray: "4 4",
            }}
          />
        ))}

        {renderedSatellites.map((sat) => {
          const entry = SATELLITE_CATALOG.find((c) => c.id === sat.id);
          const pos = positions.get(sat.id);
          if (!pos) return null;
          const isSelected = selectedId === sat.id;
          const isFeatured = entry !== undefined;
          const color = entry ? CATEGORY_COLOR[entry.category] : bulkObjectColor(sat.name, sat.id);
          const name = entry?.name ?? sat.name;
          return (
            <CircleMarker
              key={sat.id}
              center={[pos.lat, pos.lon]}
              radius={isSelected ? 7 : isFeatured ? 4.5 : 2.5}
              pathOptions={{
                color: isSelected ? "#FFFFFF" : color,
                weight: isSelected ? 2 : 1,
                fillColor: color,
                fillOpacity: isFeatured || isSelected ? 0.9 : 0.6,
              }}
              eventHandlers={{
                click: () => onSelect(sat.id, pos),
              }}
            >
              {(isFeatured || isSelected) && (
                <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                  {name}
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}

        {location && (
          <CircleMarker
            center={[location.lat, location.lon]}
            radius={6}
            pathOptions={{ color: "#FF6A3D", weight: 2, fillColor: "#FF6A3D", fillOpacity: 0.25 }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
              Your location
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
