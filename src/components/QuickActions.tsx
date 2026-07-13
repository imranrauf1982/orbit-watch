"use client";

import type { ReactNode } from "react";

/**
 * Left-side quick actions panel.
 *
 * Purely presentational for now — each action exposes an onClick hook so
 * the actual behaviour (geolocation lookup, camera fly-to, notification
 * subscriptions, sky-facing lookup, saved list) can be wired in later
 * without touching layout/styling again.
 */

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  accent: string; // tailwind color token driving the icon glow
};

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 21s-6.5-5.86-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.14-6.5 11-6.5 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconSatellite() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <rect
        x="9.2"
        y="9.2"
        width="5.6"
        height="5.6"
        rx="1"
        transform="rotate(45 12 12)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 6.5 7 9.5M20 17.5l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 4.5l3 3M17.5 19.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.5 9.5l2-2M7.5 16.5l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 4.6 1.8 5.6a.6.6 0 0 1-.5 1H4.7a.6.6 0 0 1-.5-1C5 14.6 6 13.2 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 9l-2 5.5L9 15l2-5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 3.5l2.47 5.13 5.53.66-4.1 3.86 1.1 5.6L12 15.9l-4.99 2.85 1.1-5.6-4.1-3.86 5.53-.66L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      id: "where-am-i",
      label: "Where Am I?",
      hint: "Center the view on your location",
      icon: <IconPin />,
      accent: "text-orbit",
    },
    {
      id: "fly-with-satellite",
      label: "Fly With Satellite",
      hint: "Ride along in orbit, first-person",
      icon: <IconSatellite />,
      accent: "text-signal",
    },
    {
      id: "next-pass-alert",
      label: "Next Pass Alert",
      hint: "Get notified before it's overhead",
      icon: <IconBell />,
      accent: "text-warn",
    },
    {
      id: "whats-above-me",
      label: "What's Above Me?",
      hint: "See what's currently overhead",
      icon: <IconCompass />,
      accent: "text-orbit",
    },
    {
      id: "my-favorites",
      label: "My Favorites",
      hint: "Jump back to saved satellites",
      icon: <IconStar />,
      accent: "text-signal",
    },
  ];

  const handleAction = (id: string) => {
    // Placeholder — hooked up per-action once the underlying features land.
    console.info(`[QuickActions] "${id}" clicked — not wired up yet.`);
  };

  return (
    <div
      className="hidden sm:flex pointer-events-auto absolute left-6 top-24 w-64 flex-col gap-2 rounded-lg border border-panelBorder bg-panel/80 p-3 backdrop-blur-md shadow-[0_0_30px_-12px_rgba(79,216,235,0.25)] animate-panel-in"
      aria-label="Quick actions"
    >
      <p className="px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted">
        Quick Actions
      </p>
      <div className="flex flex-col gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => handleAction(a.id)}
            className="group flex items-center gap-3 rounded-md border border-panelBorder/80 bg-void/50 px-3 py-2.5 text-left transition-all hover:border-signal/50 hover:bg-signal/[0.06] hover:shadow-[0_0_16px_-6px_rgba(255,106,61,0.4)] active:scale-[0.98]"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-panel border border-panelBorder/80 ${a.accent} transition-colors group-hover:border-current/40`}
            >
              {a.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[13px] font-medium text-ink">
                {a.label}
              </span>
              <span className="block truncate font-body text-[10.5px] text-muted">{a.hint}</span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
