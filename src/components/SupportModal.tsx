"use client";

export default function SupportModal({ onClose }: { onClose: () => void }) {
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
          <h2 className="font-display font-bold text-ink text-sm">SUPPORT ORBIT WATCH</h2>
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
            Orbit Watch is free, has no ads, and doesn&apos;t sell your data. Hosting and the
            TLE data pipeline still cost something to run — if this is useful to you, a small
            contribution helps keep it that way.
          </p>

          <div className="flex flex-col gap-2">
            <a
              href="https://www.buymeacoffee.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center rounded-xl border border-signal/40 bg-signal/10 px-3 py-2 text-xs font-mono text-signal hover:bg-signal/20 transition-all duration-300 ease-out"
            >
              ☕ BUY ME A COFFEE
            </a>
            <a
              href="mailto:hello@orbitwatch.app?subject=Orbit%20Watch%20feedback"
              className="w-full text-center rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-2 text-xs font-mono text-ink hover:border-signal/40 transition-all duration-300 ease-out"
            >
              ✉ SEND FEEDBACK INSTEAD
            </a>
          </div>

          <p className="text-[11px] text-muted/80">
            No pressure — sharing the site with someone who&apos;d like it helps just as much.
          </p>
        </div>
      </div>
    </div>
  );
}
