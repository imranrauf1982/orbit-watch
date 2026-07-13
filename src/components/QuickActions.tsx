"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import * as satellite from "satellite.js";
import type { TleResult } from "@/lib/fetch-tle";
import type { ObserverLocation, LocationStatus } from "@/lib/use-location";
import { SATELLITE_CATALOG } from "@/lib/satellite-catalog";
import { computeWhereAmI, type WhereAmIResult } from "@/lib/where-am-i";
import { findWhatsAboveMe, type OverheadResult } from "@/lib/whats-above";
import { computePasses, azimuthToCompass, type PassPrediction } from "@/lib/passes";
import { estimateBrightness } from "@/lib/brightness";
import {
  isFavorite,
  toggleFavorite,
  subscribeFavorites,
  getFavoritesSnapshot,
  getFavoritesServerSnapshot,
} from "@/lib/use-favorites";
import LocationSearch from "./LocationSearch";

/**
 * Left-side quick actions panel.
 *
 * Each of the 5 actions below is wired to real orbital-mechanics logic
 * (lib/where-am-i.ts, lib/whats-above.ts, lib/passes.ts) and to the
 * existing 3D scene (fly-cam / observer line via callbacks passed in from
 * OrbitWatchApp). Nothing here changes the panel's layout or styling —
 * only the button behaviour and a handful of small popup modals that were
 * previously empty.
 */

type Props = {
  satellites: TleResult[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  flyMode: boolean;
  onToggleFlyMode: (next: boolean) => void;
  onShowLocateLine: (id: number) => void;
};

type ModalKind = "where-am-i" | "next-pass" | "whats-above" | "favorites" | null;
// Which action is waiting on a satellite to be picked, when none is selected yet.
type PendingAction = "where-am-i" | "fly" | "next-pass" | null;

function fmt(n: number, digits = 1) {
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

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  accent: string; // tailwind color token driving the icon glow
};

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 21s-6.5-5.86-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.14-6.5 11-6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconSatellite() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect
        x="9.2"
        y="9.2"
        width="5.6"
        height="5.6"
        rx="1"
        transform="rotate(45 12 12)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 6.5 7 9.5M20 17.5l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 4.5l3 3M17.5 19.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.5 9.5l2-2M7.5 16.5l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 4.6 1.8 5.6a.6.6 0 0 1-.5 1H4.7a.6.6 0 0 1-.5-1C5 14.6 6 13.2 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 9l-2 5.5L9 15l2-5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 3.5l2.47 5.13 5.53.66-4.1 3.86 1.1 5.6L12 15.9l-4.99 2.85 1.1-5.6-4.1-3.86 5.53-.66L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuickActions({
  satellites,
  selectedId,
  onSelect,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  flyMode,
  onToggleFlyMode,
  onShowLocateLine,
}: Props) {
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const selectedSat = useMemo(
    () => satellites.find((s) => s.id === selectedId) ?? null,
    [satellites, selectedId]
  );
  const selectedName =
    (selectedId !== null && SATELLITE_CATALOG.find((c) => c.id === selectedId)?.name) ||
    selectedSat?.name ||
    null;

  // Only offer satellites we actually have TLE data for, so the picker
  // never lets someone choose something we can't yet propagate.
  const pickableCatalog = useMemo(
    () => SATELLITE_CATALOG.filter((c) => satellites.some((s) => s.id === c.id)),
    [satellites]
  );

  const actions: QuickAction[] = [
    {
      id: "where-am-i",
      label: "Where Am I?",
      hint: "Center the view on your location",
      icon: <IconPin />,
      accent: "text-orbit",
    },
    {
      id: "fly-with-satellite",
      label: "Fly With Satellite",
      hint: "Ride along in orbit, first-person",
      icon: <IconSatellite />,
      accent: "text-signal",
    },
    {
      id: "next-pass-alert",
      label: "Next Pass Alert",
      hint: "Get notified before it's overhead",
      icon: <IconBell />,
      accent: "text-warn",
    },
    {
      id: "whats-above-me",
      label: "What's Above Me?",
      hint: "See what's currently overhead",
      icon: <IconCompass />,
      accent: "text-orbit",
    },
    {
      id: "my-favorites",
      label: "My Favorites",
      hint: "Jump back to saved satellites",
      icon: <IconStar />,
      accent: "text-signal",
    },
  ];

  const handleAction = (id: string) => {
    switch (id) {
      case "where-am-i":
        if (selectedId === null) {
          setPendingAction("where-am-i");
          return;
        }
        onShowLocateLine(selectedId);
        setActiveModal("where-am-i");
        break;
      case "fly-with-satellite":
        if (flyMode) {
          onToggleFlyMode(false);
          return;
        }
        if (selectedId === null) {
          setPendingAction("fly");
          return;
        }
        onToggleFlyMode(true);
        break;
      case "next-pass-alert":
        if (selectedId === null) {
          setPendingAction("next-pass");
          return;
        }
        setActiveModal("next-pass");
        break;
      case "whats-above-me":
        setActiveModal("whats-above");
        break;
      case "my-favorites":
        setActiveModal("favorites");
        break;
      default:
        break;
    }
  };

  // Resolves a satellite picked from the "select a satellite first" prompt,
  // then continues whichever action was waiting on it.
  const handlePickForPending = (id: number) => {
    onSelect(id);
    if (pendingAction === "where-am-i") {
      onShowLocateLine(id);
      setActiveModal("where-am-i");
    } else if (pendingAction === "fly") {
      onToggleFlyMode(true);
    } else if (pendingAction === "next-pass") {
      setActiveModal("next-pass");
    }
    setPendingAction(null);
  };

  return (
    <>
      <div
        className="hidden sm:flex pointer-events-auto absolute left-6 top-24 w-64 flex-col gap-2 rounded-lg border border-panelBorder bg-panel/80 p-3 backdrop-blur-md shadow-[0_0_30px_-12px_rgba(79,216,235,0.25)] animate-panel-in"
        aria-label="Quick actions"
      >
        <p className="px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted">
          Quick Actions
        </p>
        <div className="flex flex-col gap-1.5">
          {actions.map((a) => {
            const isActiveFly = a.id === "fly-with-satellite" && flyMode;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.id)}
                aria-pressed={isActiveFly}
                className={`group flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all hover:border-signal/50 hover:bg-signal/[0.06] hover:shadow-[0_0_16px_-6px_rgba(255,106,61,0.4)] active:scale-[0.98] ${
                  isActiveFly
                    ? "border-signal/60 bg-signal/[0.08]"
                    : "border-panelBorder/80 bg-void/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-panel border border-panelBorder/80 ${a.accent} transition-colors group-hover:border-current/40`}
                >
                  {a.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[13px] font-medium text-ink">
                    {isActiveFly ? "Flying — click to exit" : a.label}
                  </span>
                  <span className="block truncate font-body text-[10.5px] text-muted">{a.hint}</span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Satellite picker: shown when an action needs a selection first --- */}
      {pendingAction && (
        <SatellitePickerModal
          catalog={pickableCatalog}
          onPick={handlePickForPending}
          onClose={() => setPendingAction(null)}
        />
      )}

      {/* --- Where Am I? --- */}
      {activeModal === "where-am-i" && (
        <WhereAmIModal
          satelliteName={selectedName}
          selectedSat={selectedSat}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* --- Next Pass Alert --- */}
      {activeModal === "next-pass" && (
        <NextPassModal
          satelliteId={selectedId}
          satelliteName={selectedName}
          selectedSat={selectedSat}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* --- What's Above Me? --- */}
      {activeModal === "whats-above" && (
        <WhatsAboveModal
          satellites={satellites}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
          onHighlight={(id) => onSelect(id)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* --- My Favorites --- */}
      {activeModal === "favorites" && (
        <FavoritesModal
          satellites={satellites}
          selectedId={selectedId}
          selectedName={selectedName}
          onJumpTo={(id) => {
            onSelect(id);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared modal chrome — same overlay pattern as AboutModal/SupportModal */
/* ------------------------------------------------------------------ */

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[2200] flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-panelBorder bg-panel p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-[11px] font-mono"
            aria-label="Close"
          >
            CLOSE
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Small "share your location" prompt, reused across modals that need it. */
function LocationPrompt({
  locationStatus,
  onRequestLocation,
  onManualLocation,
}: {
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
}) {
  return (
    <div className="text-center py-2">
      <p className="text-xs text-muted font-body mb-3">
        This needs your location to calculate — it stays entirely in your browser.
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
  );
}

/* ------------------------------------------------------------------ */
/* Satellite picker — used when an action is clicked with none selected */
/* ------------------------------------------------------------------ */

function SatellitePickerModal({
  catalog,
  onPick,
  onClose,
}: {
  catalog: typeof SATELLITE_CATALOG;
  onPick: (id: number) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="SELECT A SATELLITE" onClose={onClose}>
      <p className="text-xs text-muted font-body mb-3">
        Pick a satellite to continue — you can also select one first from the list on the right.
      </p>
      {catalog.length === 0 ? (
        <p className="text-xs text-muted font-body py-4 text-center">Still loading satellites…</p>
      ) : (
        <ul className="divide-y divide-panelBorder border border-panelBorder rounded-md overflow-hidden max-h-72 overflow-y-auto">
          {catalog.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onPick(c.id)}
                className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-white/5 font-body transition-colors"
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Where Am I? */
/* ------------------------------------------------------------------ */

function WhereAmIModal({
  satelliteName,
  selectedSat,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  onClose,
}: {
  satelliteName: string | null;
  selectedSat: TleResult | null;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  onClose: () => void;
}) {
  const result: WhereAmIResult | null = useMemo(() => {
    if (!selectedSat || !location) return null;
    try {
      const satrec = satellite.twoline2satrec(selectedSat.line1, selectedSat.line2);
      return computeWhereAmI(satrec, location.lat, location.lon);
    } catch {
      return null;
    }
  }, [selectedSat, location]);

  return (
    <ModalShell title={`WHERE AM I — ${satelliteName ?? "SATELLITE"}`} onClose={onClose}>
      {!location ? (
        <LocationPrompt
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
        />
      ) : !result ? (
        <p className="text-xs text-muted font-body py-4 text-center">
          Couldn&apos;t calculate a position for this satellite right now — its orbital data may
          be invalid or decayed.
        </p>
      ) : (
        <div>
          <p className="text-[11px] text-muted font-body mb-3">
            A line has been drawn on the 3D globe between your location and this satellite (fades
            after a few seconds).
          </p>
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs">
            <dt className="text-muted">DISTANCE TO YOU</dt>
            <dd className="tabular text-signal text-right">{fmt(result.distanceKm, 0)} km</dd>

            <dt className="text-muted">ALTITUDE</dt>
            <dd className="tabular text-orbit text-right">{fmt(result.altitudeKm, 0)} km</dd>

            {result.closestApproach && (
              <>
                <dt className="text-muted">CLOSEST APPROACH</dt>
                <dd className="tabular text-ink text-right">
                  {fmtTime(result.closestApproach.time)}
                </dd>
                <dt className="text-muted">CLOSEST DISTANCE</dt>
                <dd className="tabular text-signal text-right">
                  {fmt(result.closestApproach.distanceKm, 0)} km
                </dd>
              </>
            )}
          </dl>
          <p className="text-[10px] text-muted font-mono mt-3">
            Closest approach is estimated over the next 6 hours from now.
          </p>
        </div>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Next Pass Alert */
/* ------------------------------------------------------------------ */

function NextPassModal({
  satelliteId,
  satelliteName,
  selectedSat,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  onClose,
}: {
  satelliteId: number | null;
  satelliteName: string | null;
  selectedSat: TleResult | null;
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  onClose: () => void;
}) {
  const [passes, setPasses] = useState<PassPrediction[] | null>(null);
  const [computing, setComputing] = useState(false);
  const [alertSetKey, setAlertSetKey] = useState<string | null>(null);

  useEffect(() => {
    setPasses(null);
    setAlertSetKey(null);
    if (!selectedSat || !location) return;
    let cancelled = false;
    setComputing(true);
    const id = setTimeout(() => {
      if (cancelled) return;
      try {
        const satrec = satellite.twoline2satrec(selectedSat.line1, selectedSat.line2);
        setPasses(computePasses(satrec, location.lat, location.lon));
      } catch {
        setPasses([]);
      }
      setComputing(false);
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [selectedSat, location]);

  const handleSetAlert = (pass: PassPrediction) => {
    if (typeof window === "undefined" || satelliteId === null) return;
    const key = "orbitwatch_pass_alerts_v1";
    try {
      const raw = window.localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        satelliteId,
        satelliteName,
        passTime: pass.startTime.toISOString(),
        maxElevationDeg: pass.maxElevationDeg,
        savedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(key, JSON.stringify(list));
      console.info(`[NextPassAlert] Alert saved for ${satelliteName} at ${pass.startTime}`);
    } catch {
      /* storage full/unavailable — the visible confirmation below still shows */
    }
    setAlertSetKey(pass.startTime.toISOString());
  };

  const first = passes && passes.length > 0 ? passes[0] : null;
  const category = SATELLITE_CATALOG.find((c) => c.id === satelliteId)?.category ?? "science";
  const brightness = first ? estimateBrightness(category, first.maxElevationDeg) : null;

  return (
    <ModalShell title={`NEXT PASS — ${satelliteName ?? "SATELLITE"}`} onClose={onClose}>
      {!location ? (
        <LocationPrompt
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
        />
      ) : computing ? (
        <p className="text-xs text-muted font-body py-4 text-center animate-pulse">
          Scanning the next few days of orbits…
        </p>
      ) : !first ? (
        <p className="text-xs text-muted font-body py-4 text-center">
          No passes over the horizon in the next few days from your location.
        </p>
      ) : (
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs">
            <dt className="text-muted">PASS TIME</dt>
            <dd className="tabular text-ink text-right">{fmtTime(first.startTime)}</dd>

            <dt className="text-muted">DURATION</dt>
            <dd className="tabular text-ink text-right">
              {Math.round(first.durationSec / 60)} min
            </dd>

            <dt className="text-muted">MAX ELEVATION</dt>
            <dd className="tabular text-orbit text-right">{fmt(first.maxElevationDeg, 0)}°</dd>

            <dt className="text-muted">DIRECTION</dt>
            <dd className="tabular text-ink text-right">
              {azimuthToCompass(first.startAzimuthDeg)} → {azimuthToCompass(first.endAzimuthDeg)}
            </dd>

            {brightness && (
              <>
                <dt className="text-muted">BRIGHTNESS</dt>
                <dd className="tabular text-signal text-right">
                  {first.visible ? brightness.label : "Daylight"}
                </dd>
              </>
            )}
          </dl>

          {alertSetKey === first.startTime.toISOString() ? (
            <p className="text-[11px] text-signal font-mono">
              Alert saved locally for this pass.
            </p>
          ) : (
            <button
              onClick={() => handleSetAlert(first)}
              className="w-full rounded-md border border-signal/60 bg-signal/10 px-3 py-1.5 text-xs font-mono text-signal hover:bg-signal/20 transition-colors"
            >
              SET ALERT
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* What's Above Me? */
/* ------------------------------------------------------------------ */

function WhatsAboveModal({
  satellites,
  location,
  locationStatus,
  onRequestLocation,
  onManualLocation,
  onHighlight,
  onClose,
}: {
  satellites: TleResult[];
  location: ObserverLocation | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onManualLocation: (lat: number, lon: number) => void;
  onHighlight: (id: number) => void;
  onClose: () => void;
}) {
  const [result, setResult] = useState<OverheadResult | null | undefined>(undefined);

  useEffect(() => {
    setResult(undefined);
    if (!location) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      setResult(findWhatsAboveMe(satellites, location.lat, location.lon));
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [satellites, location]);

  return (
    <ModalShell title="WHAT'S ABOVE ME?" onClose={onClose}>
      {!location ? (
        <LocationPrompt
          locationStatus={locationStatus}
          onRequestLocation={onRequestLocation}
          onManualLocation={onManualLocation}
        />
      ) : result === undefined ? (
        <p className="text-xs text-muted font-body py-4 text-center animate-pulse">
          Scanning the sky above you…
        </p>
      ) : result === null ? (
        <p className="text-xs text-muted font-body py-4 text-center">
          Nothing currently tracked is above the horizon from your location.
        </p>
      ) : (
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs">
            <dt className="text-muted">SATELLITE</dt>
            <dd className="tabular text-ink text-right truncate">{result.name}</dd>

            <dt className="text-muted">ELEVATION</dt>
            <dd className="tabular text-orbit text-right">{fmt(result.elevationDeg, 0)}°</dd>

            <dt className="text-muted">DISTANCE</dt>
            <dd className="tabular text-signal text-right">{fmt(result.distanceKm, 0)} km</dd>

            <dt className="text-muted">ALTITUDE</dt>
            <dd className="tabular text-ink text-right">{fmt(result.altitudeKm, 0)} km</dd>

            <dt className="text-muted">VELOCITY</dt>
            <dd className="tabular text-ink text-right">{fmt(result.velocityKmS, 2)} km/s</dd>
          </dl>
          <button
            onClick={() => {
              onHighlight(result.id);
              onClose();
            }}
            className="w-full rounded-md border border-orbit/60 bg-orbit/10 px-3 py-1.5 text-xs font-mono text-orbit hover:bg-orbit/20 transition-colors"
          >
            HIGHLIGHT ON GLOBE
          </button>
        </div>
      )}
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* My Favorites */
/* ------------------------------------------------------------------ */

function FavoriteRow({
  id,
  satellites,
  onJumpTo,
}: {
  id: number;
  satellites: TleResult[];
  onJumpTo: (id: number) => void;
}) {
  const entry = SATELLITE_CATALOG.find((c) => c.id === id);
  const sat = satellites.find((s) => s.id === id);
  const name = entry?.name ?? sat?.name ?? `NORAD ${id}`;

  const live = useMemo(() => {
    if (!sat) return null;
    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const pv = satellite.propagate(satrec, new Date());
      if (!pv || typeof pv.position === "boolean") return null;
      const gmst = satellite.gstime(new Date());
      const geodetic = satellite.eciToGeodetic(pv.position, gmst);
      return { altitudeKm: geodetic.height };
    } catch {
      return null;
    }
  }, [sat]);

  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-ink font-body truncate">{name}</p>
        <p className="text-[10px] text-muted font-mono">
          {sat ? (live ? `${fmt(live.altitudeKm, 0)} km · live` : "loading telemetry…") : "not loaded yet"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onJumpTo(id)}
          disabled={!sat}
          className="rounded-md border border-panelBorder px-2 py-1 text-[10px] font-mono text-ink hover:border-signal/60 disabled:opacity-40 transition-colors"
        >
          SELECT
        </button>
        <button
          onClick={() => toggleFavorite(id)}
          className="text-warn hover:text-ink text-[11px] font-mono"
          aria-label="Remove from favorites"
          title="Remove from favorites"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function FavoritesModal({
  satellites,
  selectedId,
  selectedName,
  onJumpTo,
  onClose,
}: {
  satellites: TleResult[];
  selectedId: number | null;
  selectedName: string | null;
  onJumpTo: (id: number) => void;
  onClose: () => void;
}) {
  const favoriteIds = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesServerSnapshot
  );
  const selectedIsFavorite = selectedId !== null && isFavorite(selectedId);

  return (
    <ModalShell title="MY FAVORITES" onClose={onClose}>
      {selectedId !== null && (
        <div className="mb-3 pb-3 border-b border-panelBorder flex items-center justify-between gap-2">
          <p className="text-xs text-ink font-body truncate">
            Currently selected: <span className="text-muted">{selectedName ?? selectedId}</span>
          </p>
          <button
            onClick={() => toggleFavorite(selectedId)}
            className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-mono transition-colors ${
              selectedIsFavorite
                ? "border-signal/60 bg-signal/20 text-signal"
                : "border-panelBorder text-muted hover:text-ink"
            }`}
          >
            {selectedIsFavorite ? "★ SAVED" : "☆ SAVE"}
          </button>
        </div>
      )}

      {favoriteIds.length === 0 ? (
        <p className="text-xs text-muted font-body py-4 text-center">
          No favorites yet — select a satellite and star it to save it here.
        </p>
      ) : (
        <ul className="divide-y divide-panelBorder border border-panelBorder rounded-md overflow-hidden">
          {favoriteIds.map((id) => (
            <FavoriteRow key={id} id={id} satellites={satellites} onJumpTo={onJumpTo} />
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
