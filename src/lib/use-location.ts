"use client";

import { useCallback, useRef, useState } from "react";

export type ObserverLocation = { lat: number; lon: number };
export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

// Desktops frequently have no GPS/WiFi positioning hardware to resolve a
// browser geolocation fix from. On phones that almost always succeeds
// quickly; on many desktop setups (wired ethernet, no WiFi scan data) some
// browsers don't even call the error callback — they just never call
// anything, leaving the caller stuck on "requesting" forever. This
// approximates a location from the browser's public IP address instead, so
// desktop users still get a usable result rather than a dead end. Best
// effort only — if it fails too, we still fall back to "denied" so the UI
// can offer the manual city/zip search.
async function ipFallbackLocation(): Promise<ObserverLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data: { latitude?: number; longitude?: number } = await res.json();
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      return { lat: data.latitude, lon: data.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export function useLocation() {
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  // Guards against a late resolution (watchdog vs. the real browser
  // callback vs. a second request() call) double-firing state updates.
  const settledRef = useRef(false);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    settledRef.current = false;
    setStatus("requesting");

    const finishWithIpFallback = async () => {
      if (settledRef.current) return;
      const approx = await ipFallbackLocation();
      if (settledRef.current) return; // the real geolocation callback won meanwhile
      settledRef.current = true;
      if (approx) {
        setLocation(approx);
        setStatus("granted");
      } else {
        setStatus("denied");
      }
    };

    // Belt-and-braces watchdog: guarantees we move on after a few seconds
    // even if the browser never invokes either callback at all (seen on
    // some desktop setups), instead of relying solely on the `timeout`
    // option below, which isn't consistently honored everywhere.
    const watchdog = setTimeout(finishWithIpFallback, 8000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settledRef.current) return;
        settledRef.current = true;
        clearTimeout(watchdog);
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus("granted");
      },
      () => {
        if (settledRef.current) return;
        clearTimeout(watchdog);
        finishWithIpFallback();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return { location, status, request, setLocation };
}
