"use client";

import { useEffect, useState } from "react";

const FUN_FACTS = [
  "The ISS orbits Earth every ~90 minutes — about 16 sunrises a day.",
  "Hubble has made over 1.6 million observations since 1990.",
  "Satellites in low Earth orbit travel at roughly 7.8 km/s.",
  "Starlink satellites deorbit and burn up within a few years by design.",
  "Geostationary satellites orbit once every 23h 56m, matching Earth's spin.",
  "The first artificial satellite, Sputnik 1, launched on 4 Oct 1957.",
  "Tiangong means 'Heavenly Palace' — China's modular space station.",
  "Landsat has been continuously imaging Earth's surface since 1972.",
];

export default function LoadingScreen() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFactIndex((i) => (i + 1) % FUN_FACTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void px-6 text-center">
      <p className="font-mono text-xs tracking-widest text-orbit animate-pulse">
        INITIALIZING ORBIT MODEL…
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-panelBorder">
        <div className="h-full w-1/3 animate-[loadbar_1.4s_ease-in-out_infinite] rounded-full bg-signal" />
      </div>
      <p key={factIndex} className="max-w-xs text-xs text-muted font-body animate-[fadein_0.4s_ease]">
        {FUN_FACTS[factIndex]}
      </p>
      <style>{`
        @keyframes loadbar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
