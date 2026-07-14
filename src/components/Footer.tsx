"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { liveViewerEstimate } from "@/lib/live-stats";
import { getSimClockSnapshot, subscribeSimClock } from "@/lib/sim-clock";

type Props = {
  onAbout: () => void;
  onSupport: () => void;
  /** True while the satellite detail panel is open — lifts the pill above it instead of overlapping. */
  raised?: boolean;
};

export default function Footer({ onAbout, onSupport, raised = false }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const viewers = now ? liveViewerEstimate(now) : null;
  const simClock = useSyncExternalStore(subscribeSimClock, getSimClockSnapshot, () => ({
    speed: 1,
    paused: false,
  }));
  const rateLabel = simClock.paused
    ? "PAUSED"
    : simClock.speed !== 1
    ? `${simClock.speed}x SIM`
    : null;

  return (
    <footer
      className={`pointer-events-auto hidden sm:flex items-center gap-3 mb-3 rounded-full border border-panelBorder bg-panel/80 backdrop-blur-xl px-4 py-1.5 text-[11px] font-mono text-muted shadow-[0_4px_24px_-6px_rgba(0,0,0,0.6)] transition-all duration-300 ${
        raised ? "self-end mr-4 sm:mr-6" : "self-center"
      }`}
    >
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
        {viewers !== null ? `${viewers} tracking now` : "—"}
      </span>
      <span className="text-panelBorder">·</span>
      <span className="tabular" title="Local time">
        {now ? now.toLocaleTimeString() : "--:--:--"}
      </span>
      <span className="text-panelBorder">·</span>
      <span className="tabular" title="Coordinated Universal Time">
        {now ? now.toISOString().slice(11, 19) : "--:--:--"} UTC
      </span>
      {rateLabel && (
        <>
          <span className="text-panelBorder">·</span>
          <span className="text-signal">{rateLabel}</span>
        </>
      )}
      <span className="text-panelBorder">·</span>
      <button onClick={onAbout} className="hover:text-ink transition-all duration-300 ease-out">
        About
      </button>
      <span className="text-panelBorder">·</span>
      <button onClick={onAbout} className="hover:text-ink transition-all duration-300 ease-out">
        Data Sources
      </button>
      <span className="text-panelBorder">·</span>
      <a
        href="mailto:hello@orbitwatch.app?subject=Orbit%20Watch%20feedback"
        className="hover:text-ink transition-all duration-300 ease-out"
      >
        Feedback
      </a>
      <span className="text-panelBorder">·</span>
      <button onClick={onSupport} className="text-signal hover:text-ink transition-all duration-300 ease-out">
        Support
      </button>
    </footer>
  );
}
