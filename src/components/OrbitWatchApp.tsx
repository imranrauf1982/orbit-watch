"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hud from "./Hud";
import LoadingScreen from "./LoadingScreen";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";
import { useLocation } from "@/lib/use-location";
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

export type ViewMode = "3d" | "map";
export type CatalogStatus = "loading" | "ready" | "error";

export default function OrbitWatchApp({ initialSatellites }: { initialSatellites: TleResult[] }) {
  // Page loads with just the curated ~15 satellites (fast). The full
  // multi-thousand-object catalog is fetched here, in the background,
  // right after mount — it doesn't block first paint, and by the time
  // someone clicks "All Active" or searches for something outside the
  // curated set, it's usually already arrived.
  const [satellites, setSatellites] = useState<TleResult[]>(initialSatellites);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");

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
          setSatellites(Array.from(byId.values()));
          setCatalogStatus("ready");
        } else {
          setCatalogStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogStatus("error");
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
  const { location, status: locationStatus, request: requestLocation, setLocation } =
    useLocation();

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
        />
      ) : (
        <MapView
          satellites={satellites}
          selectedId={selectedId}
          onSelect={handleSelect}
          location={location}
          filter={filter}
          showDots={showDots}
        />
      )}
      <Hud
        satellites={satellites}
        catalogStatus={catalogStatus}
        selectedId={selectedId}
        liveState={liveState}
        onSelect={handlePickFromList}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        location={location}
        locationStatus={locationStatus}
        onRequestLocation={requestLocation}
        onManualLocation={handleManualLocation}
        filter={filter}
        onFilterChange={setFilter}
        showDots={showDots}
        onShowDotsChange={setShowDots}
      />
    </div>
  );
}
