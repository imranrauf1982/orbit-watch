/**
 * A lightweight "N people tracking right now" number. There's no analytics
 * backend behind this yet, so it's a deterministic pseudo-random value that
 * drifts slowly over real time — same idea as the "X people viewing this
 * listing" pattern, without pretending to be precise telemetry.
 *
 * Deterministic on (time-bucket) so it's stable across re-renders and does
 * not jump around erratically, and consistent between server/client for a
 * given minute.
 */
export function liveViewerEstimate(date: Date = new Date()): number {
  const bucket = Math.floor(date.getTime() / (60 * 1000)); // changes once/minute
  // Simple hash -> pseudo-random in [0, 1)
  const x = Math.sin(bucket * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);

  const base = 320;
  const range = 260;
  return Math.round(base + frac * range);
}
