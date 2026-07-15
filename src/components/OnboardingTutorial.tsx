"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "WELCOME TO ORBIT MAP",
    body: "A live 3D map of real satellites, built from public orbital data. Drag to rotate, scroll to zoom, click any satellite to see it up close.",
  },
  {
    title: "SWITCH VIEWS",
    body: "3D gives you the globe. MAP shows a flat 2D ground track. SKY shows what's overhead from your location right now. Shortcuts: 1 / 2 / 3.",
  },
  {
    title: "FIND A SATELLITE",
    body: "Use TARGETS (or press /) to search by name, filter by group (Starlink, stations, all active objects), and jump straight to it.",
  },
  {
    title: "PLAYBACK & EXTRAS",
    body: "In 3D view, use the speed buttons or Space to pause/fast-forward simulated time. Toggle SHOW ORBITS for full orbital paths, and CONTRAST (or C) for a brighter high-visibility theme.",
  },
];

export default function OnboardingTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[3000] flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/5 bg-space-900/80 backdrop-blur-xl p-5 animate-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink text-sm">{STEPS[step].title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-[11px] font-mono"
            aria-label="Close tutorial"
          >
            SKIP
          </button>
        </div>

        <p className="text-xs font-body text-muted leading-relaxed mb-4">{STEPS[step].body}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-signal" : "bg-panelBorder"}`}
              />
            ))}
          </div>
          <button
            onClick={() => (last ? onClose() : setStep((s) => s + 1))}
            className="rounded-xl border border-signal/40 bg-signal/10 px-3 py-1.5 text-[11px] font-mono text-signal hover:bg-signal/20 transition-all duration-300 ease-out"
          >
            {last ? "GOT IT" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
