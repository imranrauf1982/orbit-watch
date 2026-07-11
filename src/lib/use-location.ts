"use client";

import { useCallback, useState } from "react";

export type ObserverLocation = { lat: number; lon: number };
export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function useLocation() {
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus("granted");
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, status, request, setLocation };
}
