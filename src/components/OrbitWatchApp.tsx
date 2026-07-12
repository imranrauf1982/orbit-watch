"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function OrbitWatchApp({ satellites }: { satellites: TleResult[] }) {
  // Default selection is the first curated/featured satellite (e.g. ISS),
  // not just satellites[0] — the bulk array is in CelesTrak's own order now.
  const defaultSelectedId = useMemo(() => {
    for (const entry of SATELLITE_CATALOG) {
      if (satellites.some((s) => s.id === entry.id)) return entry.id;
    }
    return satellites[0]?.id ?? null;
  }, [satellites]);

  const [selectedId, setSelectedId] = useState<number | null>(defaultSelectedId);
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  // Default to the small curated set (Phase 2 constraint: don't render
  // thousands of dots by default).
  const [filter, setFilter] = useState<FilterGroup>("featured");
  const { location, status: locationStatus, request: requestLocation, setLocation } =
    useLocation();

  // Deep link support: /?sat=25544 preselects a satellite on load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("sat");
    if (!param) return;
    const id = Number(param);
    if (Number.isFinite(id) && satellites.some((s) => s.id === id)) {
      setSelectedId(id);
      // A deep-linked satellite outside the curated set needs the "All
      // Active" filter on, or it won't exist in the rendered scene to select.
      if (!SATELLITE_CATALOG.some((c) => c.id === id)) setFilter("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        />
      ) : (
        <MapView
          satellites={satellites}
          selectedId={selectedId}
          onSelect={handleSelect}
          location={location}
          filter={filter}
        />
      )}
      <Hud
        satellites={satellites}
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
      />
    </div>
  );
}
