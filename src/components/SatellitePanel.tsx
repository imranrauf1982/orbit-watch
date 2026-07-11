"use client";

import { useEffect, useMemo, useState } from "react";
import * as satellite from "satellite.js";
import { CATEGORY_COLOR, CATEGORY_LABEL, type CatalogEntry } from "@/lib/satellite-catalog";
import type { LiveState } from "@/lib/orbit";
import { getOrbitalElements } from "@/lib/orbit";
import { computePasses, azimuthToCompass, type PassPrediction } from "@/lib/passes";
import { estimateBrightness } from "@/lib/brightness";
import type { ObserverLocation, LocationStatus } from "@/lib/use-location";
import LocationSearch from "./LocationSearch";
import AlertSignup from "./AlertSignup";

type Tab = "telemetry" | "info" | "passes";

type Props = {
  entry: CatalogEntry;
  line1: string;
  line2: string;
  liveState: LiveState | null;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  onClose: () => void;
  onShare: () => void;
  shareCopied: boolean;
};

function fmt(n: number, digits = 2) {
  return n.toFixed(digits);
}

function fmtTime(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SatellitePanel({
  entry,
  line1,
  line2,
  liveState,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  onClose,
  onShare,
  shareCopied,
}: Props) {
  const [tab, setTab] = useState<Tab>("telemetry");
  const [passes, setPasses] = useState<PassPrediction[] | null>(null);
  const [computing, setComputing] = useState(false);

  const satrec = useMemo(() => satellite.twoline2satrec(line1, line2), [line1, line2]);
  const elements = useMemo(() => getOrbitalElements(satrec), [satrec]);

  // Reset cached passes whenever the selected satellite changes
  useEffect(() => {
    setPasses(null);
  }, [entry.id]);

  useEffect(() => {
    if (tab !== "passes" || !location || passes || computing) return;
    setComputing(true);
    // Defer so the "calculating" state actually paints before the (synchronous) crunch.
    const id = setTimeout(() => {
      const result = computePasses(satrec, location.lat, location.lon);
      setPasses(result);
      setComputing(false);
    }, 30);
    return () => clearTimeout(id);
  }, [tab, location, passes, computing, satrec]);

  const color = CATEGORY_COLOR[entry.category];

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 sm:right-auto sm:bottom-6 sm:left-6 sm:w-96 border-t sm:border sm:rounded-lg border-panelBorder bg-panel/95 backdrop-blur flex flex-col max-h-[75vh] sm:max-h-[32rem]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm text-ink truncate">{entry.name}</h2>
            <p className="text-[11px] text-muted font-mono">
              {CATEGORY_LABEL[entry.category]} · NORAD {entry.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onShare}
            className="text-muted hover:text-ink text-[11px] font-mono"
            aria-label="Copy shareable link"
            title="Copy shareable link"
          >
            {shareCopied ? "COPIED" : "SHARE"}
          </button>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-[11px] font-mono"
            aria-label="Close panel"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-panelBorder px-4 gap-4 text-[11px] font-mono">
        {(
          [
            ["telemetry", "LIVE"],
            ["info", "INFO"],
            ["passes", "PASSES"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 border-b-2 transition-colors ${
              tab === key
                ? "border-signal text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto p-4">
        {tab === "telemetry" &&
          (liveState ? (
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
          ) : (
            <p className="text-xs text-muted font-body">Waiting for telemetry…</p>
          ))}

        {tab === "info" && (
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs">
            <dt className="text-muted">INCLINATION</dt>
            <dd className="tabular text-ink text-right">{fmt(elements.inclinationDeg, 1)}°</dd>

            <dt className="text-muted">ORBITAL PERIOD</dt>
            <dd className="tabular text-ink text-right">{fmt(elements.periodMin, 1)} min</dd>

            <dt className="text-muted">REVS / DAY</dt>
            <dd className="tabular text-ink text-right">{fmt(elements.revsPerDay, 2)}</dd>

            <dt className="text-muted">APOGEE</dt>
            <dd className="tabular text-ink text-right">{fmt(elements.apogeeKm, 0)} km</dd>

            <dt className="text-muted">PERIGEE</dt>
            <dd className="tabular text-ink text-right">{fmt(elements.perigeeKm, 0)} km</dd>

            <dt className="text-muted">ECCENTRICITY</dt>
            <dd className="tabular text-ink text-right">{elements.eccentricity.toFixed(4)}</dd>
          </dl>
        )}

        {tab === "passes" && (
          <div>
            {!location ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted font-body mb-3">
                  Share your location to see when {entry.name} will be visible overhead.
                  This stays entirely in your browser — nothing is sent to a server.
                </p>
                <button
                  onClick={onRequestLocation}
                  className="rounded-md border border-signal/60 bg-signal/10 px-3 py-1.5 text-xs font-mono text-signal hover:bg-signal/20 transition-colors"
                >
                  {locationStatus === "requesting" ? "LOCATING…" : "USE MY LOCATION"}
                </button>
                {locationStatus === "denied" && (
                  <p className="text-[11px] text-warn font-mono mt-2">
                    Location permission denied — enable it in your browser settings and retry.
                  </p>
                )}
                {locationStatus === "unsupported" && (
                  <p className="text-[11px] text-warn font-mono mt-2">
                    Geolocation isn&apos;t supported in this browser.
                  </p>
                )}
                <p className="text-[11px] text-muted font-mono mt-3 mb-1">or</p>
                <LocationSearch onPick={onManualLocation} />
              </div>
            ) : computing ? (
              <p className="text-xs text-muted font-body py-4 text-center animate-pulse">
                Scanning the next few days of orbits…
              </p>
            ) : passes && passes.length > 0 ? (
              <>
                <ul className="divide-y divide-panelBorder -mx-1">
                  {passes.map((p, i) => {
                    const brightness = estimateBrightness(entry.category, p.maxElevationDeg);
                    return (
                      <li key={i} className="px-1 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-ink font-body">{fmtTime(p.startTime)}</p>
                          <p className="text-[11px] text-muted font-mono">
                            {Math.round(p.durationSec / 60)} min · max {fmt(p.maxElevationDeg, 0)}° ·{" "}
                            {azimuthToCompass(p.startAzimuthDeg)}→{azimuthToCompass(p.endAzimuthDeg)}
                          </p>
                          {p.visible && (
                            <p className="text-[11px] text-muted/80 font-mono" title={brightness.hint}>
                              {brightness.label}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            p.visible
                              ? "bg-signal/15 text-signal"
                              : "bg-panelBorder text-muted"
                          }`}
                        >
                          {p.visible ? "VISIBLE" : "DAYLIGHT"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <AlertSignup satelliteId={entry.id} satelliteName={entry.name} />
                <div className="mt-3 pt-3 border-t border-panelBorder">
                  <p className="text-[11px] text-muted font-body mb-1">Not your location?</p>
                  <LocationSearch onPick={onManualLocation} />
                </div>
              </>
            ) : passes ? (
              <div>
                <p className="text-xs text-muted font-body py-4 text-center">
                  No passes over the horizon in the next few days from your location.
                </p>
                <div className="pt-1 border-t border-panelBorder">
                  <p className="text-[11px] text-muted font-body mb-1 mt-2">Try another location:</p>
                  <LocationSearch onPick={onManualLocation} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
