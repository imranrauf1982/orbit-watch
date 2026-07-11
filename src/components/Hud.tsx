"use client";

import { useMemo, useState } from "react";
import {
  SATELLITE_CATALOG,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
} from "@/lib/satellite-catalog";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import { useLocation } from "@/lib/use-location";
import SatellitePanel from "./SatellitePanel";
import AboutModal from "./AboutModal";

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  liveState: LiveState | null;
  onSelect: (id: number | null) => void;
};

export default function Hud({ satellites, selectedId, liveState, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { location, status: locationStatus, request: requestLocation } = useLocation();

  const available = useMemo(
    () =>
      SATELLITE_CATALOG.filter((c) => satellites.some((s) => s.id === c.id)).filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase())
      ),
    [satellites, query]
  );

  const selectedEntry = SATELLITE_CATALOG.find((c) => c.id === selectedId) ?? null;
  const selectedTle = satellites.find((s) => s.id === selectedId) ?? null;

  const handleShare = () => {
    if (selectedId === null || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("sat", String(selectedId));
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    });
    window.history.replaceState(null, "", url.toString());
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAboutOpen(true)}
            className="rounded-md border border-panelBorder bg-panel/80 h-7 w-7 flex items-center justify-center text-xs font-mono text-muted hover:text-ink backdrop-blur"
            aria-label="About Orbit Watch"
            title="About & data sources"
          >
            i
          </button>
          <button
            onClick={() => setListOpen((v) => !v)}
            className="sm:hidden rounded-md border border-panelBorder bg-panel/80 px-3 py-1.5 text-xs font-mono text-ink backdrop-blur"
            aria-expanded={listOpen}
          >
            {listOpen ? "CLOSE" : "TARGETS"}
          </button>
        </div>
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

      {/* Satellite panel: live telemetry, orbital info, upcoming passes */}
      {selectedEntry && selectedTle && (
        <SatellitePanel
          entry={selectedEntry}
          line1={selectedTle.line1}
          line2={selectedTle.line2}
          liveState={liveState}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={requestLocation}
          onClose={() => onSelect(null)}
          onShare={handleShare}
          shareCopied={shareCopied}
        />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
