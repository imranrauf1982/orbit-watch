/**
 * "Next Pass Alert" storage + notification scheduling.
 *
 * Previously "SET ALERT" only wrote an entry to localStorage and printed a
 * console.info — nothing ever actually notified the person when the pass
 * arrived. This gives it a real (if honestly-scoped) mechanism:
 *
 *   - Requests browser Notification permission when an alert is set.
 *   - While Orbit Watch is open in a tab (this one or another), a single
 *     interval (started from OrbitWatchApp) checks the saved alert list
 *     once a second and fires a real Notification at/after the pass start
 *     time, then removes it so it doesn't fire twice.
 *
 * Honest limitation: this is client-side and tab-based, not a push
 * notification — there's no server component sending it, so it only fires
 * while a browser process for this site is running (the tab can be in the
 * background, but the browser itself needs to be open). A true "notify me
 * even if my browser is closed" alert would need server-side scheduling +
 * the Push API, which isn't wired up here.
 */

const STORAGE_KEY = "orbitwatch_pass_alerts_v1";

export type PassAlert = {
  satelliteId: number;
  satelliteName: string | null;
  passTime: string; // ISO
  maxElevationDeg: number;
  savedAt: string; // ISO
  notified?: boolean;
};

function readAll(): PassAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PassAlert[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: PassAlert[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage full/unavailable */
  }
}

export function getPassAlerts(): PassAlert[] {
  return readAll();
}

/** True if the browser supports Notifications and permission is already granted. */
export function notificationsGranted(): boolean {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Saves the alert and, if needed, asks for Notification permission. Returns
 * the permission state so the UI can tell the person what to expect (e.g.
 * "denied" means it will only be visible in-app, not as a system alert).
 */
export async function setPassAlert(alert: PassAlert): Promise<NotificationPermission | "unsupported"> {
  const list = readAll().filter(
    (a) => !(a.satelliteId === alert.satelliteId && a.passTime === alert.passTime)
  );
  list.push(alert);
  writeAll(list);

  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }
  return Notification.permission;
}

export function removePassAlert(satelliteId: number, passTime: string) {
  writeAll(readAll().filter((a) => !(a.satelliteId === satelliteId && a.passTime === passTime)));
}

/**
 * Checks all saved alerts against the current time and fires a Notification
 * (or falls back to nothing if permission was never granted — the saved
 * alert itself still shows in the "Next Pass Alert" card either way) for any
 * whose pass has arrived. Call this from a single interval at the app root
 * so it fires regardless of which Quick Actions card happens to be open.
 */
export function checkDuePassAlerts(now: Date = new Date()) {
  const list = readAll();
  if (list.length === 0) return;
  let changed = false;

  for (const alert of list) {
    if (alert.notified) continue;
    const passTime = new Date(alert.passTime).getTime();
    if (now.getTime() < passTime) continue;
    // Passes are brief — don't fire a stale notification hours late if the
    // tab was closed through the actual pass window.
    if (now.getTime() - passTime > 10 * 60 * 1000) {
      alert.notified = true;
      changed = true;
      continue;
    }
    if (notificationsGranted()) {
      try {
        new Notification(`${alert.satelliteName ?? "Satellite"} is overhead now`, {
          body: `Max elevation ~${Math.round(alert.maxElevationDeg)}° — look up!`,
          tag: `orbitwatch-pass-${alert.satelliteId}-${alert.passTime}`,
        });
      } catch {
        /* some browsers restrict constructing Notification directly; safe to ignore */
      }
    }
    alert.notified = true;
    changed = true;
  }

  if (changed) writeAll(list);
}
