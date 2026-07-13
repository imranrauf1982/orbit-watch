"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "orbitwatch_high_contrast";

/**
 * High-contrast mode: brightens text/borders for readability (bright
 * sunlight, low-vision users). Persisted across visits, applied as a
 * `.high-contrast` class on <html> — see globals.css for the overrides.
 */
export function useHighContrast(): [boolean, (updater: boolean | ((v: boolean) => boolean)) => void] {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setEnabledState(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("high-contrast", enabled);
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled]);

  const setEnabled = (updater: boolean | ((v: boolean) => boolean)) => {
    setEnabledState((prev) => (typeof updater === "function" ? (updater as (v: boolean) => boolean)(prev) : updater));
  };

  return [enabled, setEnabled];
}
