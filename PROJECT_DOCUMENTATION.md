# OrbitMap (Orbit Watch) — Full Project Documentation

A live 3D satellite / ISS tracking web app. This document explains the entire codebase: the framework, folder structure, every file's job, data flow, and how the pieces connect — so anyone (including a future you) can understand the project without re-reading all the source.

---

## 1. What This Project Is

**OrbitMap** (internal package name `space-tracker`, repo name `orbit-watch`) is a website that shows real satellites (ISS, Hubble, weather satellites, Starlink, etc.) moving in real time, using real public orbital data. It has three main "views": a rotating 3D globe, a 2D map, and a sky-dome (naked-eye) view — plus tools like "what's above me right now" and "when will the ISS next be visible from my location."

- **Live demo concept:** marketing landing page → "Launch App" → full interactive tracker at `/app`.
- **Data source:** [CelesTrak](https://celestrak.org) — free, no API key, publishes TLE (Two-Line Element) orbital data for active satellites.
- **No backend database / no user accounts** — everything is computed client-side or via lightweight serverless API routes; nothing is persisted server-side (the `/account` page literally says "accounts aren't open yet").

---

## 2. Framework & Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** (App Router) | 14.2.35 |
| UI library | **React** | 18.3.1 |
| Language | **TypeScript** | 5.5.3 |
| 3D rendering | **three.js** + **@react-three/fiber** (React renderer for three.js) + **@react-three/drei** (helper components) | three 0.164.1, fiber 8.16.8, drei 9.108.3 |
| Orbital mechanics | **satellite.js** (SGP4/SDP4 propagation library) | 5.0.0 |
| 2D map | **Leaflet** + **react-leaflet** | 1.9.4 / 4.2.1 |
| Fuzzy search | **Fuse.js** | 7.0.0 |
| Styling | **Tailwind CSS** (utility classes) + CSS Modules (for the landing/placeholder pages) | 3.4.4 |
| Fonts | `next/font/google` — Plus Jakarta Sans (UI), IBM Plex Mono (numeric/telemetry text), Space Grotesk (landing page display font) | — |
| PWA | Custom `public/sw.js` service worker + `site.webmanifest` | — |

This is a **client-heavy Next.js app**: most interactivity (3D scene, map, sky view, HUD, quick actions) runs in the browser (`"use client"` components). The server side is thin — two Next.js Route Handlers (API routes) and a couple of server components that pre-fetch initial data.

### Why Next.js App Router specifically
- Server Components fetch the initial "featured" satellite set (`src/app/app/page.tsx`) before the page ever reaches the browser, so the app isn't blank while waiting on the first network request.
- Route-level `revalidate` (ISR / ISR-like ehaviour) is used to cache CelesTrak responses for an hour, since orbital data doesn't change fast enough to justify hitting CelesTrak on every request.
- Heavy client-only libraries (three.js, Leaflet) are loaded with `next/dynamic({ ssr: false })` so they never break server-side rendering (they touch `window`/`canvas`, which don't exist on the server).

---

## 3. How to Run It (from the project's own README)

```bash
cd space-tracker
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # production build
```

Deployment target: **Vercel** (zero-config for Next.js). Custom domain optional via Vercel's Domains settings.

`package.json` scripts:
| Script | Purpose |
|---|---|
| `dev` | `next dev` — local dev server |
| `build` | `next build` — production build |
| `start` | `next start` — run the production build |
| `lint` | `next lint` — ESLint |

---

## 4. Top-Level Folder Structure

```
orbit-watch-main/
├── README.md                 Setup/deploy instructions (Hinglish, written for a portfolio/gig context)
├── next.config.mjs           Next.js config (React strict mode, SWC minify)
├── next-env.d.ts             Next.js TypeScript ambient types (auto-generated, do not edit)
├── package.json              Dependencies + npm scripts
├── package-lock.json         Locked dependency tree
├── postcss.config.mjs        PostCSS config (Tailwind + Autoprefixer)
├── tailwind.config.ts        Tailwind theme customization (colors, fonts, radii)
├── tsconfig.json             TypeScript compiler config, "@/*" path alias → "./src/*"
├── public/                   Static assets served as-is
│   ├── apple-touch-icon.png, favicon-32.png, icon-192.png, icon-512.png
│   ├── robots.txt
│   ├── site.webmanifest      PWA manifest (name, icons, theme colors)
│   ├── sw.js                 Service worker (offline caching strategy)
│   ├── satellites/           18 real satellite photos (PNG) used as 3D marker textures
│   └── textures/             Earth textures (day map, clouds, night lights) — currently unused by default (globe is wireframe)
└── src/
    ├── app/                  Next.js App Router — pages + API routes
    ├── components/           React components (mostly client components)
    ├── lib/                  Framework-agnostic logic: orbital math, hooks, data fetching, small stores
    └── workers/               Web Worker for off-main-thread satellite propagation
```

---

## 5. `src/app/` — Routes (Next.js App Router)

Next.js App Router maps folders to URL routes automatically. Each `page.tsx` is a route; `route.ts` inside `api/` is a backend endpoint.

| Path (file) | URL | Type | Purpose |
|---|---|---|---|
| `layout.tsx` | (wraps every page) | Server Component | Root HTML shell: loads Google fonts, sets global `<html>`/`<body>` classes, defines all SEO metadata (title, description, Open Graph, Twitter card, PWA icons), mounts `ServiceWorkerRegister` |
| `page.tsx` | `/` | Client Component | **Marketing landing page** — hero section, nav, feature cards ("Where Am I?", "What's Above Me?", "Next Pass") that deep-link into `/app`, contact modal, footer |
| `app/page.tsx` | `/app` | Server Component (async) | **The actual tracker application.** Server-fetches the curated ~15 "featured" satellites via `fetchFeaturedTle()`, then renders `<OrbitWatchApp initialSatellites={...} />`. Uses `export const revalidate = 3600` (1 hour ISR) |
| `about/page.tsx` | `/about` | Server Component | Placeholder "story coming soon" page |
| `account/page.tsx` | `/account` | Server Component | Placeholder — explains there's no sign-in yet |
| `blog/page.tsx` | `/blog` | Server Component | Placeholder "posts coming soon" page |
| `products/page.tsx` | `/products` | Server Component | Placeholder "more products coming soon" page |
| `api/tle/route.ts` | `GET /api/tle` | Route Handler | Returns the **full bulk CelesTrak catalog** (thousands of objects) as JSON, cached 1 hour server-side + `Cache-Control` header for CDN/browser caching |
| `api/subscribe/route.ts` | `POST /api/subscribe` | Route Handler | Validates an email + `satelliteId` from the "pass alert" signup form. **Stub only** — validates and returns `{ok: true}`, does not actually store or send anything yet (documented in the code as a TODO for a future email provider integration) |
| `globals.css` | — | Tailwind base styles + CSS custom properties | |
| `Home.module.css` | — | CSS Module | All styling for the landing page (`page.tsx`) — stars/nebula background, hero, nav, feature cards, modal |
| `Placeholder.module.css` | — | CSS Module | Shared styling for the four placeholder pages (About/Account/Blog/Products) |

### Route/page relationship diagram
```
/  (landing page)
 ├── "Launch App" button        → /app
 ├── Feature cards (deep link)  → /app?feature=where-am-i | above-me | next-pass
 ├── About / Blog / Products / Account nav links → respective placeholder pages
 └── Contact → in-page modal (mailto: link, no backend)

/app (tracker)
 ├── initial data: fetchFeaturedTle() (server, ~15 satellites, parallel requests)
 ├── background: GET /api/tle (client, full catalog, thousands of objects)
 └── optional deep link: /app?sat=<NORAD_ID> preselects a satellite
```

---

## 6. `src/components/` — React Components

All components below are Client Components (`"use client"`) unless noted. Grouped by role.

### 6.1 App shell / orchestration
- **`OrbitWatchApp.tsx`** (325 lines) — The top-level client controller for `/app`. Owns almost all shared state: satellite list, selected satellite, view mode (`3d` / `map` / `sky`), filters, location, "fly with satellite" mode, the "locate line" (line drawn from observer to a satellite), and deep-link parsing (`?sat=` and `?feature=`). Lazily loads `Scene`, `MapView`, and `SkyDomeView` via `next/dynamic` (client-only, no SSR) and renders whichever is active, plus the `Hud` overlay on top.
- **`Scene.tsx`** (338 lines) — The 3D view. Wraps `@react-three/fiber`'s `<Canvas>`, sets up camera, `OrbitControls`, starfield (`Stars` from drei), and renders `Earth`, `SatelliteMarker`s (per-satellite), `SatelliteCloud` (bulk dots), `ContinentLabels`, `CameraFocus`, `FlyCam`, and `LocateLine` as needed.
- **`Hud.tsx`** (701 lines — largest UI component besides QuickActions) — The heads-up display overlay: search bar (Fuse.js fuzzy search over the catalog), satellite list/results, filter pills (Featured/Starlink/Stations/All), view-mode switcher, telemetry readout for the selected satellite, and hosts `QuickActions`, `AboutModal`, `SupportModal`, `OnboardingTutorial` triggers.
- **`QuickActions.tsx`** (1232 lines — the single largest file in the project) — Implements the three flagship features from the landing page:
  1. **Where Am I?** — draws a live line/distance between the user's location and a chosen satellite (`lib/where-am-i.ts`).
  2. **What's Above Me?** — lists satellites currently overhead, sorted by elevation (`lib/whats-above.ts`).
  3. **Next Pass** — predicts upcoming visible passes for a satellite from the user's location, with an optional browser-notification alert (`lib/passes.ts`, `lib/pass-alerts.ts`).

### 6.2 3D scene building blocks
- **`Earth.tsx`** — Renders the globe itself. Deliberately a **procedural wireframe grid**, not a photo-realistic texture (documented performance decision — "tactical/mission-control" look, faster load). Exports `EARTH_RADIUS` (2.4, the scene-space radius used everywhere) and `latLonToDirection()`, a shared lat/lon → 3D vector helper used across many other components. Uses `subsolarPoint()` from `lib/sun.ts` for day/night shading.
- **`SatelliteMarker.tsx`** (380 lines) — One 3D marker per curated satellite: live position (via `propagate()`), a small orbit trail, billboard label (HTML overlay via drei's `Html`/`Billboard`), and click-to-select.
- **`SatelliteCloud.tsx`** — Renders the *bulk* catalog (thousands of objects) as lightweight instanced points/dots instead of full markers, for performance. Powered by `lib/use-satellite-cloud.ts`.
- **`ContinentLabels.tsx`** — Floating HTML labels for continents on the globe.
- **`CameraFocus.tsx`** — Smoothly animates the camera to focus on a selected satellite.
- **`FlyCam.tsx`** — "Fly with satellite" chase-cam mode — camera follows a satellite's position/orientation each frame.
- **`LocateLine.tsx`** (225 lines) — Draws the animated line from the observer's location to a satellite in 3D space (used by "Where Am I?" / "What's Above Me?").
- **`LoadingScreen.tsx`** — Shown while the 3D/map/sky bundles are being dynamically imported; cycles through space fun-facts.

### 6.3 Alternate views
- **`MapView.tsx`** (347 lines) — 2D Leaflet map with satellite ground-tracks (polylines) and live position markers (`CircleMarker`), an alternative to the 3D globe.
- **`SkyDomeView.tsx`** (337 lines) — A flattened "dome" projection (azimuth/elevation) showing what's visible in the sky from the observer's location right now.
- **`SkyRealisticView.tsx`** (311 lines) — A more realistic sky rendering: uses solar elevation and eclipse state (`lib/sun.ts`) to color the sky (day/twilight/night) and show whether a satellite would be visibly sunlit.

### 6.4 Panels, modals, and small UI
- **`SatellitePanel.tsx`** (362 lines) — Detail panel for a selected satellite: category, brightness estimate, orbital elements, upcoming passes.
- **`LocationSearch.tsx`** — Free-text place search box (city/zip/landmark) using `lib/geocode.ts`.
- **`AlertSignup.tsx`** — Email capture form that posts to `/api/subscribe` for pass-alert interest.
- **`AboutModal.tsx`**, **`SupportModal.tsx`** — Simple informational modals launched from the HUD/Footer.
- **`OnboardingTutorial.tsx`** — First-visit step-by-step walkthrough overlay.
- **`Footer.tsx`** — Bottom bar; shows a live "N people tracking now" estimate (`lib/live-stats.ts`) and the sim-clock state.
- **`ServiceWorkerRegister.tsx`** — Registers `public/sw.js` on `window.load` (client-only, deferred so it never competes with first-paint resources).

---

## 7. `src/lib/` — Core Logic (framework-agnostic)

This is where nearly all of the "real" science and business logic lives, deliberately kept separate from React components so it's independently testable and reusable across the 3D/map/sky views.

### 7.1 Orbital mechanics & astronomy
| File | Purpose |
|---|---|
| `orbit.ts` | Core propagation: `propagate()` converts a TLE (`satrec`) + time into `{lat, lon, altitudeKm, velocityKmS}` using satellite.js's SGP4 algorithm; `geodeticToVector3()` converts lat/lon/alt into a 3D scene-space position; `getOrbitalElements()` extracts orbital parameters (inclination, period, etc.) |
| `topocentric.ts` | Converts a satellite's ECI (Earth-Centered Inertial) position into **look angles** (azimuth/elevation/range) as seen from a specific observer on the ground — the math behind "which direction do I look" |
| `sun.ts` (183 lines) | Sun position (`sunEci`), subsolar point (for Earth day/night terminator), eclipse detection (`isEclipsed` — is the satellite in Earth's shadow, hence not visible even at night), solar elevation angle, and a sky color palette generator based on sun elevation (dawn/day/dusk/night) |
| `passes.ts` | `computePasses()` — predicts upcoming visible pass windows (start/max-elevation/end) for a satellite from a given location; `azimuthToCompass()` converts a bearing in degrees to a compass direction (N/NE/E…) |
| `brightness.ts` | `estimateBrightness()` — rough naked-eye visibility/magnitude estimate for a satellite (very-bright/bright/moderate/faint tiers) |
| `where-am-i.ts` | Powers the "Where Am I?" quick action: `computeWhereAmINow()` (live distance/altitude from observer to satellite), `computeClosestApproach()` |
| `whats-above.ts` | Powers "What's Above Me?": `findWhatsAboveMe()` scans all tracked satellites and returns those currently above the horizon, sorted by elevation |
| `earth-spin.ts` | Computes Earth's real sidereal rotation angle (`SIDEREAL_DAY_SEC = 86164.0905`s) so the globe's spin and satellites' orbits stay physically consistent at any simulation speed multiplier |

### 7.2 Data fetching & catalog
| File | Purpose |
|---|---|
| `fetch-tle.ts` | Talks to **CelesTrak**. `fetchBulkTle()` — pulls the entire "active satellites" group (thousands of objects) as raw TLE text, parses it, retries once uncached on failure/empty result (to avoid caching a transient 0-result). `fetchFeaturedTle()` — fast path, fetches only the curated ~15 satellites in parallel for fast first paint. Both are called from server code (`app/page.tsx`, `api/tle/route.ts`) |
| `satellite-catalog.ts` | The curated/static list (`SATELLITE_CATALOG`) of ~15-20 notable satellites (ISS, Hubble, Tiangong, NOAA/weather sats, Landsat, etc.) with id (NORAD number), category, and optional real-photo image slug. Also defines category colors/labels, the `FEATURED_IDS` set, and filter-group logic (`featured` / `starlink` / `stations` / `all`) used to color/bucket the *bulk* catalog objects that aren't individually curated |
| `satellite-icon-preload.ts` | Warms the browser's image cache with every satellite photo PNG up front so 3D markers don't flash a fallback icon before their real photo loads |
| `geocode.ts` | Free-text place search + reverse geocoding via OpenStreetMap's public Nominatim API |
| `kml-export.ts` | Generates a KML ground-track file for a satellite's full orbit and triggers a browser download — lets users open a satellite's path in Google Earth |

### 7.3 State stores / hooks (no external state library — hand-rolled with `useSyncExternalStore`)
| File | Purpose |
|---|---|
| `sim-clock.ts` | A tiny external store for "simulation time" — lets the HUD control playback speed (1x/10x/60x/etc.) and pause, and lets any component read the current sim-adjusted time via `getSimTime()` instead of `new Date()`, without prop-drilling |
| `use-favorites.ts` | Favorited satellite IDs, persisted to `localStorage`, same external-store pattern as `sim-clock.ts` |
| `use-location.ts` | React hook wrapping the browser Geolocation API — `status`: idle/requesting/granted/denied/unsupported |
| `use-high-contrast.ts` | Toggle + persisted preference for a high-contrast accessibility mode |
| `use-satellite-cloud.ts` | Feeds the bulk `SatelliteCloud` 3D component with live-updating positions |
| `pass-alerts.ts` | Stores "notify me before this pass" alerts (localStorage) and requests/uses the browser **Notification API** to actually fire a real notification when a saved pass time arrives — checked once/second from `OrbitWatchApp`. Documented as a known, honest limitation: only works while the tab is open (no server push) |
| `live-stats.ts` | A deterministic, time-seeded pseudo-random "N people tracking now" counter for the footer — explicitly documented as **not real analytics**, just a stable-looking UX flourish |

### 7.4 Data types shared across the app
- `TleResult` (`fetch-tle.ts`) — `{ id, name, line1, line2 }`, the raw two-line-element pair for one satellite.
- `LiveState` (`orbit.ts`) — `{ lat, lon, altitudeKm, velocityKmS }`, a satellite's current propagated state.
- `CatalogEntry` (`satellite-catalog.ts`) — static metadata for a curated satellite.
- `ObserverLocation` (`use-location.ts`) — `{ lat, lon }` for the user.

---

## 8. `src/workers/propagation.worker.ts` — Web Worker

Runs bulk SGP4 propagation **off the main thread** for performance when displaying thousands of satellites at once (the `SatelliteCloud`). It:
- Owns a cache of parsed `satrec` objects (parsed once, reused every tick).
- On each `"tick"` message, propagates every cached satellite and posts back a single **transferred** `Float32Array` of packed `[x, y, z, x, y, z, ...]` positions (transfer, not copy — avoids the cost of cloning large arrays across the worker boundary) plus the matching id order, so the main thread can map results back for click-selection.
- Deliberately dependency-free (no `@react-three/fiber`, no DOM APIs) — only needs `satellite.js`, which is pure JS and safe to run inside a worker.

---

## 9. Data Flow (End-to-End)

```
CelesTrak (public TLE feed)
        │
        ├── server: fetchFeaturedTle()  → app/page.tsx (Server Component)
        │        → ~15 curated satellites, parallel requests, revalidate 1hr
        │        → passed as `initialSatellites` prop into <OrbitWatchApp>
        │
        └── server: fetchBulkTle()      → api/tle/route.ts (GET /api/tle)
                 → thousands of objects, revalidate 1hr + Cache-Control header
                 → fetched again from the CLIENT inside OrbitWatchApp's
                   useEffect right after mount (background, non-blocking)
                 → merged with the curated set, cached again in
                   localStorage as a fallback for offline / CelesTrak-down

OrbitWatchApp (client state owner)
        │
        ├── satellites[] ── LiveState per satellite computed on demand via
        │                   lib/orbit.ts `propagate(satrec, simTime)`
        │                   (simTime comes from lib/sim-clock.ts, which lets
        │                   playback speed/pause apply uniformly everywhere)
        │
        ├── viewMode: "3d" | "map" | "sky"  → renders Scene | MapView | SkyDomeView
        │
        └── Hud (search, filters, telemetry, QuickActions)
                 ├── Where Am I?   → lib/where-am-i.ts
                 ├── What's Above Me? → lib/whats-above.ts
                 └── Next Pass     → lib/passes.ts (+ lib/pass-alerts.ts for
                                     browser Notification scheduling)
```

**Offline support:** `public/sw.js` (service worker) caches the app shell (network-first, so a redeploy is never masked by a stale cache), static assets (cache-first), and `/api/tle` responses (network-first with cache fallback) — so a returning visitor with no connection still sees the last good satellite data.

---

## 10. Design/Performance Decisions Worth Knowing (from in-code comments)

- **Earth is a wireframe, not a photo texture** — intentional "mission-control" aesthetic *and* a performance choice (no large texture download). Photo textures exist in `public/textures/` for future use but aren't wired in by default.
- **Two-tier satellite loading** — a small curated set loads first (fast first paint), the full multi-thousand-object catalog loads lazily in the background so the "Featured" default view never waits on it.
- **Bulk propagation happens in a Web Worker** to keep 60fps on the main thread even with thousands of objects.
- **`dpr={[1, 1.75]}`** caps rendering resolution on high-DPI/mobile devices to protect frame rate.
- **Fonts are self-hosted via `next/font/google`** (no runtime request to Google), which helps Lighthouse/performance scores.
- **`/api/subscribe` and the "N people tracking" counter are honestly-scoped stubs** — the code comments are explicit that these don't have a real backend/analytics system behind them yet.

---

## 11. Known Placeholders / Not-Yet-Built Areas

These are explicitly unfinished in the code (useful if you're continuing development):
- `/about`, `/blog`, `/products`, `/account` — all placeholder "coming soon" pages.
- `/api/subscribe` — accepts and validates email signups but doesn't email or store anyone yet (needs a provider like Resend/Mailgun/ConvertKit).
- Pass-alert notifications only fire while the browser tab is open — no server-side push notification system.
- No user accounts/authentication anywhere in the app.

---

## 12. Quick File-Purpose Cheat Sheet

| If you want to change... | Edit this file |
|---|---|
| Which satellites are "featured" by default | `src/lib/satellite-catalog.ts` |
| How TLE data is fetched/parsed from CelesTrak | `src/lib/fetch-tle.ts` |
| The math for where a satellite is right now | `src/lib/orbit.ts` |
| Visible-pass prediction logic | `src/lib/passes.ts` |
| The 3D globe's look | `src/components/Earth.tsx` |
| Search bar / filters / telemetry HUD | `src/components/Hud.tsx` |
| Where Am I / What's Above Me / Next Pass features | `src/components/QuickActions.tsx` + matching `src/lib/*.ts` |
| The 2D map view | `src/components/MapView.tsx` |
| The landing page copy/design | `src/app/page.tsx` + `src/app/Home.module.css` |
| Site-wide metadata/SEO/fonts | `src/app/layout.tsx` |
| Offline caching behavior | `public/sw.js` |
| Color palette / Tailwind theme | `tailwind.config.ts` |

---

*Generated by analyzing the full contents of `orbit-watch-main.zip` (all files under `src/`, `public/`, and the project root configs).*
