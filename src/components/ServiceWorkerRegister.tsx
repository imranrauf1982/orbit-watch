"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register after load so it never competes with first-paint resources.
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Force an update check immediately, and take over as soon as a
          // new worker is ready — so a fixed deploy reaches visitors on
          // this same visit instead of waiting for a future reload.
          reg.update().catch(() => {});
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                // A new version is live; a normal refresh will now pick it up.
              }
            });
          });
        })
        .catch(() => {
          /* offline support is a nice-to-have — fail silently */
        });
    });
  }, []);

  return null;
}
