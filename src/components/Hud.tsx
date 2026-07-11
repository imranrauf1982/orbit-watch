"use client";

import { useMemo, useState } from "react";
import {
  SATELLITE_CATALOG,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
} from "@/lib/satellite-catalog";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  liveState: LiveState | null;
  onSelect: (id: number | null) => void;
};

function fmt(n: number, digits = 2) {
  return n.toFixed(digits);
}

export default function Hud({ satellites, selectedId, liveState, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);

  const available = useMemo(
    () =>
      SATELLITE_CATALOG.filter((c) => satellites.some((s) => s.id === c.id)).filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase())
      ),
    [satellites, query]
  );

  const selectedEntry = SATELLITE_CATALOG.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* Header */}
      <header className="pointer-events-auto flex items-start justify-between gap-4 p-4 sm:p-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">
            ORBIT WATCH
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted font-body">
            Live positions from real orbital element data
          </p>
        </div>
        <button
          onClick={() => setListOpen((v) => !v)}
          className="sm:hidden rounded-md border border-panelBorder bg-panel/80 px-3 py-1.5 text-xs font-mono text-ink backdrop-blur"
          aria-expanded={listOpen}
        >
          {listOpen ? "CLOSE" : "TARGETS"}
        </button>
      </header>

      <div className="flex-1" />

      {/* Satellite list — sidebar on desktop, sheet on mobile */}
      <div
        className={`pointer-events-auto fixed sm:absolute right-0 top-0 sm:top-20 h-full sm:h-auto sm:max-h-[70vh] w-full sm:w-72 sm:rounded-l-lg border-l border-panelBorder bg-panel/95 backdrop-blur transition-transform duration-300 sm:translate-x-0 ${
          listOpen ? "translate-x-0" : "translate-x-full sm:translate-x-0"
        } flex flex-col`}
      >
        <div className="p-3 border-b border-panelBorder">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search satellite…"
            className="w-full rounded-md bg-void border border-panelBorder px-3 py-2 text-sm text-ink placeholder:text-muted font-body focus:border-signal outline-none"
          />
        </div>
        <ul className="overflow-y-auto flex-1 divide-y divide-panelBorder">
          {available.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => {
                  onSelect(entry.id);
                  setListOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors ${
                  selectedId === entry.id ? "bg-white/5" : ""
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLOR[entry.category] }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-ink truncate font-body">{entry.name}</span>
                  <span className="block text-[11px] text-muted font-mono">
                    {CATEGORY_LABEL[entry.category]}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {available.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted font-body">
              No matches. Try another name.
            </li>
          )}
        </ul>
      </div>

      {/* Telemetry panel */}
      {selectedEntry && liveState && (
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 sm:right-auto sm:bottom-6 sm:left-6 sm:w-80 border-t sm:border sm:rounded-lg border-panelBorder bg-panel/95 backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLOR[selectedEntry.category] }}
              />
              <h2 className="font-display font-bold text-sm text-ink">{selectedEntry.name}</h2>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-muted hover:text-ink text-xs font-mono"
              aria-label="Close telemetry panel"
            >
              CLOSE
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs">
            <dt className="text-muted">LATITUDE</dt>
            <dd className="tabular text-signal text-right">{fmt(liveState.lat)}°</dd>

            <dt className="text-muted">LONGITUDE</dt>
            <dd className="tabular text-signal text-right">{fmt(liveState.lon)}°</dd>

            <dt className="text-muted">ALTITUDE</dt>
            <dd className="tabular text-orbit text-right">{fmt(liveState.altitudeKm, 0)} km</dd>

            <dt className="text-muted">VELOCITY</dt>
            <dd className="tabular text-orbit text-right">{fmt(liveState.velocityKmS)} km/s</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
