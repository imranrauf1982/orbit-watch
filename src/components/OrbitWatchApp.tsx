"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hud from "./Hud";
import LoadingScreen from "./LoadingScreen";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import { useLocation } from "@/lib/use-location";
import { checkDuePassAlerts } from "@/lib/pass-alerts";
import { preloadSatelliteIcons } from "@/lib/satellite-icon-preload";
import { SATELLITE_CATALOG, type FilterGroup } from "@/lib/satellite-catalog";

// three.js touches window/canvas — must be client-only, no SSR
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

// Leaflet also touches window — client-only, no SSR
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

// Pure SVG — no special client-only requirement, but dynamic-imported
// anyway for consistency and to keep it out of the initial bundle.
const SkyDomeView = dynamic(() => import("./SkyDomeView"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export type ViewMode = "3d" | "map" | "sky";
export type CatalogStatus = "loading" | "ready" | "error";

export default function OrbitWatchApp({ initialSatellites }: { initialSatellites: TleResult[] }) {
  // Page loads with just the curated ~15 satellites (fast). The full
  // multi-thousand-object catalog is fetched here, in the background,
  // right after mount — it doesn't block first paint, and by the time
  // someone clicks "All Active" or searches for something outside the
  // curated set, it's usually already arrived.
  const [satellites, setSatellites] = useState<TleResult[]>(initialSatellites);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");

  // Warms the browser's cache with every known satellite icon PNG up
  // front, so individual 3D markers resolve their own texture load almost
  // instantly instead of briefly showing the cartoon fallback first. See
  // lib/satellite-icon-preload.ts.
  useEffect(() => {
    preloadSatelliteIcons();
  }, []);

  const TLE_CACHE_KEY = "orbitwatch_tle_cache_v1";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tle")
      .then((res) => res.json())
      .then((data: { satellites?: TleResult[] }) => {
        if (cancelled) return;
        if (data.satellites && data.satellites.length > 0) {
          // The bulk set is authoritative; keep any curated entry it's
          // somehow missing (rare — e.g. temporarily excluded upstream).
          const byId = new Map(data.satellites.map((s) => [s.id, s]));
          for (const s of initialSatellites) if (!byId.has(s.id)) byId.set(s.id, s);
          const merged = Array.from(byId.values());
          setSatellites(merged);
          setCatalogStatus("ready");
          // Cache client-side too (belt-and-suspenders alongside the
          // service worker) so a fully offline reload still has data.
          try {
            window.localStorage.setItem(
              TLE_CACHE_KEY,
              JSON.stringify({ satellites: merged, savedAt: Date.now() })
            );
          } catch {
            /* storage full or unavailable — not critical */
          }
        } else {
          throw new Error("empty response");
        }
      })
      .catch(() => {
        if (cancelled) return;
        // CelesTrak/network unavailable — fall back to the last cache we
        // saved from a previous successful visit, if any, rather than
        // leaving the person with just the curated set.
        try {
          const raw = window.localStorage.getItem(TLE_CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as { satellites: TleResult[] };
            if (cached.satellites?.length > 0) {
              setSatellites(cached.satellites);
              setCatalogStatus("ready");
              return;
            }
          }
        } catch {
          /* ignore malformed cache */
        }
        setCatalogStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultSelectedId = useMemo(() => {
    for (const entry of SATELLITE_CATALOG) {
      if (initialSatellites.some((s) => s.id === entry.id)) return entry.id;
    }
    return initialSatellites[0]?.id ?? null;
  }, [initialSatellites]);

  const [selectedId, setSelectedId] = useState<number | null>(defaultSelectedId);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  // Default to the small curated set (Phase 2 constraint: don't render
  // thousands of dots by default).
  const [filter, setFilter] = useState<FilterGroup>("featured");
  const [showDots, setShowDots] = useState(true);
  const [showOrbitPaths, setShowOrbitPaths] = useState(false);
  const { location, status: locationStatus, request: requestLocation, setLocation } =
    useLocation();

  // --- Quick Actions state (Where Am I? / Fly With Satellite / What's Above Me?) ---
  // "Fly With Satellite" chase-cam toggle. Only meaningful in the 3D view —
  // auto-exits if the person switches views or clears the selection so it
  // never gets stuck active behind a different screen.
  const [flyMode, setFlyMode] = useState(false);
  // "Where Am I?" temporary line between the observer and a satellite. The
  // `key` makes re-triggering on the same satellite restart the timer/line
  // (a fresh mount) instead of being a no-op state update.
  const [locateLine, setLocateLine] = useState<{ id: number; key: number } | null>(null);

  useEffect(() => {
    if (viewMode !== "3d") setFlyMode(false);
  }, [viewMode]);

  // "Next Pass Alert" watcher — checks saved alerts once a second and fires
  // a real browser Notification when a pass arrives, regardless of which
  // Quick Actions card (if any) happens to be open. See lib/pass-alerts.ts
  // for the honest limitation: this only works while the app is open in a
  // tab, since there's no server/push component behind it.
  useEffect(() => {
    checkDuePassAlerts();
    const id = setInterval(() => checkDuePassAlerts(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (selectedId === null) setFlyMode(false);
  }, [selectedId]);

  // The "Where Am I?" / "What's Above Me?" line's lifetime is owned by
  // whichever of those two cards is currently open — see
  // handleShowLocateLine/handleHideLocateLine, called from QuickActions —
  // rather than a fixed timer. It used to auto-clear itself 9 seconds after
  // being shown regardless of whether the card was still open, which read
  // as the line randomly vanishing mid-use.

  const handleToggleFlyMode = useCallback((next: boolean) => {
    setFlyMode(next);
  }, []);

  const handleShowLocateLine = useCallback((id: number, force = false) => {
    setLocateLine((prev) => {
      // Same satellite already showing — leave the existing line/key alone
      // so it doesn't remount (and re-trigger the camera swing) on every
      // 1-2s live-update tick from the Where Am I / What's Above Me cards.
      // `force` opts out of that dedupe: What's Above Me uses it so opening
      // the card always swings the globe to face whatever's overhead, even
      // if it happens to be the same satellite that was overhead last time
      // (and the person has since rotated the globe away from it).
      if (prev && prev.id === id && !force) return prev;
      return { id, key: Date.now() };
    });
  }, []);

  const handleHideLocateLine = useCallback(() => {
    setLocateLine(null);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    // The 2D map (and the sky dome, same reasoning) reads as
    // alarming/broken when it opens straight into thousands of dots
    // (unlike the 3D globe, where it reads as "cool"). Default every entry
    // into a flat view to the clean state — "Show Dots" is still right
    // there if they want them back.
    if (mode === "map" || mode === "sky") setShowDots(false);
    setViewMode(mode);
  }, []);

  // Deep link support: /?sat=25544 preselects a satellite on load. Kept
  // pending until it's actually found in `satellites` — if it's outside the
  // curated set, that means waiting for the background catalog fetch above.
  const pendingDeepLink = useRef<{ id: number; applied: boolean } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("sat");
    if (!param) return;
    const id = Number(param);
    if (Number.isFinite(id)) pendingDeepLink.current = { id, applied: false };
  }, []);

  useEffect(() => {
    const pending = pendingDeepLink.current;
    if (!pending || pending.applied) return;
    if (satellites.some((s) => s.id === pending.id)) {
      setSelectedId(pending.id);
      if (!SATELLITE_CATALOG.some((c) => c.id === pending.id)) setFilter("all");
      pending.applied = true;
    }
  }, [satellites]);

  // Deep link support: /app?feature=where-am-i|above-me|next-pass, used by
  // the marketing homepage's Quick Actions cards to jump straight into a
  // Quick Actions panel on load. Read once on mount (same pattern as the
  // `sat` deep link above) and handed down to Hud → QuickActions, which
  // opens the matching panel itself — this component doesn't otherwise
  // know anything about the Quick Actions internals.
  const [initialFeature, setInitialFeature] = useState<
    "where-am-i" | "above-me" | "next-pass" | null
  >(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("feature");
    if (param === "where-am-i" || param === "above-me" || param === "next-pass") {
      setInitialFeature(param);
    }
  }, []);

  const handleSelect = useCallback((id: number, state: LiveState | null) => {
    setSelectedId(id);
    setLiveState(state);
  }, []);

  const handlePickFromList = useCallback((id: number | null) => {
    setSelectedId(id);
    if (id === null) setLiveState(null);
  }, []);

  const handleManualLocation = useCallback(
    (lat: number, lon: number) => {
      setLocation({ lat, lon });
    },
    [setLocation]
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void">
      {viewMode === "3d" ? (
        <Scene
          satellites={satellites}
          selectedId={selectedId}
          onSelect={handleSelect}
          filter={filter}
          showDots={showDots}
          showOrbitPaths={showOrbitPaths}
          flyMode={flyMode}
          locateLine={locateLine}
          location={location}
        />
      ) : viewMode === "map" ? (
        <MapView
          satellites={satellites}
          selectedId={selectedId}
          onSelect={handleSelect}
          location={location}
          filter={filter}
          showDots={showDots}
        />
      ) : (
        <SkyDomeView
          satellites={satellites}
          selectedId={selectedId}
          onSelect={handleSelect}
          filter={filter}
          showDots={showDots}
          location={location}
          locationStatus={locationStatus}
          onRequestLocation={requestLocation}
          onManualLocation={handleManualLocation}
        />
      )}
      <Hud
        satellites={satellites}
        catalogStatus={catalogStatus}
        selectedId={selectedId}
        liveState={liveState}
        onSelect={handlePickFromList}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        location={location}
        locationStatus={locationStatus}
        onRequestLocation={requestLocation}
        onManualLocation={handleManualLocation}
        filter={filter}
        onFilterChange={setFilter}
        showDots={showDots}
        onShowDotsChange={setShowDots}
        showOrbitPaths={showOrbitPaths}
        onShowOrbitPathsChange={setShowOrbitPaths}
        flyMode={flyMode}
        onToggleFlyMode={handleToggleFlyMode}
        onShowLocateLine={handleShowLocateLine}
        onHideLocateLine={handleHideLocateLine}
        initialFeature={initialFeature}
      />

      {/* Small, always-reachable exit button for the "Fly With Satellite"
          chase cam — sits above the HUD's z-index so it stays clickable
          regardless of which panels are open. */}
      {flyMode && (
        <button
          onClick={() => setFlyMode(false)}
          className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2 z-[2100] rounded-xl border border-signal/40 bg-space-900/70 px-4 py-2 text-[11px] font-mono text-signal backdrop-blur-xl shadow-[0_4px_20px_-6px_rgba(0,0,0,0.7)] hover:bg-signal/10 transition-all duration-300 ease-out"
        >
          EXIT FLY MODE
        </button>
      )}
    </div>
  );
}
