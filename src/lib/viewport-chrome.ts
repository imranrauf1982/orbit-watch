"use client";

/**
 * Reports the *actual, measured* pixel height of the floating chrome that
 * sits on top of the 3D/Map/Sky views on mobile — the header+quick-actions
 * block at the top, and the satellite info panel at the bottom (when one is
 * open). Written to (via ResizeObserver) by Hud.tsx and SatellitePanel.tsx;
 * read by SkyDomeView so the compass circle can size itself to whatever
 * space is *really* left, instead of a hardcoded guess that breaks the
 * moment the chrome's own height changes (longer satellite name, extra
 * quick-action row, etc).
 *
 * Same tiny external-store pattern already used by lib/sim-clock.ts and
 * lib/use-favorites.ts elsewhere in this app.
 */

let topInset = 0;
let bottomInset = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setTopInset(px: number) {
  const next = Math.round(px);
  if (next !== topInset) {
    topInset = next;
    emit();
  }
}

export function setBottomInset(px: number) {
  const next = Math.round(px);
  if (next !== bottomInset) {
    bottomInset = next;
    emit();
  }
}

export function subscribeChromeInsets(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getChromeInsetsSnapshot() {
  return { topInset, bottomInset };
}

// SSR-safe: no layout exists yet, so no reserved space.
export function getChromeInsetsServerSnapshot() {
  return { topInset: 0, bottomInset: 0 };
}
