"use client";

import { useEffect, useState } from "react";
import { liveViewerEstimate } from "@/lib/live-stats";

type Props = {
  onAbout: () => void;
  onSupport: () => void;
};

export default function Footer({ onAbout, onSupport }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const viewers = now ? liveViewerEstimate(now) : null;

  return (
    <footer className="pointer-events-auto hidden sm:flex items-center gap-3 self-center mb-3 rounded-full border border-panelBorder bg-panel/80 backdrop-blur px-4 py-1.5 text-[11px] font-mono text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
        {viewers !== null ? `${viewers} tracking now` : "—"}
      </span>
      <span className="text-panelBorder">·</span>
      <span className="tabular">{now ? now.toLocaleTimeString() : "--:--:--"}</span>
      <span className="text-panelBorder">·</span>
      <button onClick={onAbout} className="hover:text-ink transition-colors">
        About
      </button>
      <span className="text-panelBorder">·</span>
      <button onClick={onAbout} className="hover:text-ink transition-colors">
        Data Sources
      </button>
      <span className="text-panelBorder">·</span>
      <a
        href="mailto:hello@orbitwatch.app?subject=Orbit%20Watch%20feedback"
        className="hover:text-ink transition-colors"
      >
        Feedback
      </a>
      <span className="text-panelBorder">·</span>
      <button onClick={onSupport} className="text-signal hover:text-ink transition-colors">
        Support
      </button>
    </footer>
  );
}
