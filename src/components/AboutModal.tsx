"use client";

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/5 bg-space-900/80 backdrop-blur-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink text-sm">ABOUT ORBIT MAP</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-[11px] font-mono"
            aria-label="Close"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-4 text-xs font-body text-muted leading-relaxed">
          <p>
            OrbitMap renders live satellite positions in 3D by propagating real orbital
            element sets (TLEs) with SGP4 — the same model used by mission operators — right
            in your browser.
          </p>

          <div>
            <h3 className="text-ink font-mono text-[11px] mb-1">DATA SOURCES</h3>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Orbital elements: Celestrak</li>
              <li>Propagation: satellite.js (SGP4/SDP4)</li>
              <li>Sun position for visibility &amp; the terminator: a low-precision solar ephemeris</li>
            </ul>
          </div>

          <div>
            <h3 className="text-ink font-mono text-[11px] mb-1">PRIVACY</h3>
            <p>
              Pass predictions use your device&apos;s location entirely client-side to compute
              look angles — it is never transmitted anywhere. Nothing is tracked, stored, or
              shared. Clearing the tab clears everything.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-mono text-[11px] mb-1">ACCURACY</h3>
            <p>
              Pass and visibility predictions are estimates based on public orbital data, which
              can drift by hours between updates for maneuvering objects. Treat times as
              approximate, especially for passes more than a couple of days out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
