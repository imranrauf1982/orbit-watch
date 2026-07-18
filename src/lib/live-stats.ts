/**
 * A lightweight "N people tracking right now" number. There's no analytics
 * backend behind this yet, so it's a deterministic pseudo-random value that
 * drifts continuously over real time — same idea as the "X people viewing
 * this listing" pattern, without pretending to be precise telemetry.
 *
 * Deterministic on the current time (not random per render), so it's
 * consistent between server/client and doesn't jump around erratically —
 * but it does move every second, combining a few slow sine waves (for a
 * smooth organic drift) with small per-second jitter (so it doesn't look
 * like a perfect wave), always clamped to [32000, 45000].
 */
export function liveViewerEstimate(date: Date = new Date()): number {
  const t = date.getTime() / 1000; // seconds

  const min = 32000;
  const max = 45000;
  const center = (min + max) / 2;
  const amplitude = (max - min) / 2;

  // Slow-moving organic drift: a few sine waves with different periods/phases.
  const wave =
    Math.sin(t / 47) * 0.5 +
    Math.sin(t / 113 + 1.7) * 0.3 +
    Math.sin(t / 271 + 3.1) * 0.2; // combined range stays within [-1, 1]

  // Small per-second jitter so it doesn't look like a perfectly smooth wave.
  const bucket = Math.floor(t);
  const x = Math.sin(bucket * 12.9898) * 43758.5453;
  const jitter = (x - Math.floor(x) - 0.5) * 2; // [-1, 1]

  const value = center + wave * amplitude * 0.9 + jitter * amplitude * 0.1;

  return Math.round(Math.min(max, Math.max(min, value)));
}
