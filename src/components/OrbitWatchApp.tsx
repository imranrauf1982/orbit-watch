"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import Hud from "./Hud";
import type { TleResult } from "@/lib/fetch-tle";
import type { LiveState } from "@/lib/orbit";

// three.js touches window/canvas — must be client-only, no SSR
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="font-mono text-xs text-muted animate-pulse">INITIALIZING ORBIT MODEL…</p>
    </div>
  ),
});

export default function OrbitWatchApp({ satellites }: { satellites: TleResult[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(
    satellites[0]?.id ?? null
  );
  const [liveState, setLiveState] = useState<LiveState | null>(null);

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
