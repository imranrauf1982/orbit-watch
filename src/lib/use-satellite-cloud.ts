"use client";

import { useEffect, useRef, useState } from "react";
import type { TleResult } from "@/lib/fetch-tle";

export type CloudSnapshot = {
  ids: number[];
  positions: Float32Array; // packed x,y,z per id, same order as `ids`
  updatedAt: number;
};

/**
 * Owns a Web Worker that batch-propagates a large set of satellites
 * off the main thread (Phase 2). Re-inits the worker whenever the input
 * satellite list changes (e.g. a filter toggle swaps in a different group),
 * and re-ticks it on an interval rather than every animation frame — the
 * mass point cloud only needs to visibly move every second or two, not at
 * 60fps.
 */
export function useSatelliteCloud(
  satellites: Pick<TleResult, "id" | "line1" | "line2">[],
  sceneRadius: number,
  updateIntervalMs = 1500
) {
  const workerRef = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<CloudSnapshot | null>(null);
  const idsRef = useRef<number[]>([]);

  // (Re)initialize the worker whenever the satellite set changes.
  useEffect(() => {
    if (satellites.length === 0) {
      setSnapshot(null);
      return;
    }

    const worker = new Worker(
      new URL("../workers/propagation.worker.ts", import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === "ready") {
        idsRef.current = msg.ids;
        worker.postMessage({ type: "tick", time: Date.now() });
      } else if (msg.type === "positions") {
        setSnapshot({
          ids: idsRef.current,
          positions: msg.positions as Float32Array,
          updatedAt: msg.time,
        });
      }
    };

    worker.postMessage({
      type: "init",
      sceneRadius,
      satellites: satellites.map((s) => ({ id: s.id, line1: s.line1, line2: s.line2 })),
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellites, sceneRadius]);

  // Tick on an interval — not every frame.
  useEffect(() => {
    const id = setInterval(() => {
      workerRef.current?.postMessage({ type: "tick", time: Date.now() });
    }, updateIntervalMs);
    return () => clearInterval(id);
  }, [updateIntervalMs]);

  return snapshot;
}
