"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Hud from "./Hud";
import LoadingScreen from "./LoadingScreen";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";

// three.js touches window/canvas — must be client-only, no SSR
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function OrbitWatchApp({ satellites }: { satellites: TleResult[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(
    satellites[0]?.id ?? null
  );
  const [liveState, setLiveState] = useState<LiveState | null>(null);

  // Deep link support: /?sat=25544 preselects a satellite on load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("sat");
    if (!param) return;
    const id = Number(param);
    if (Number.isFinite(id) && satellites.some((s) => s.id === id)) {
      setSelectedId(id);
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

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-void">
      <Scene satellites={satellites} selectedId={selectedId} onSelect={handleSelect} />
      <Hud
        satellites={satellites}
        selectedId={selectedId}
        liveState={liveState}
        onSelect={handlePickFromList}
      />
    </div>
  );
}
